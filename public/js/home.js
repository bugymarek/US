var isLoading = false;

$(document).ready(function () {

    // nastavenie mapy
    $('.map').on('click', onDropdownMapClick);

    // podla slaceneho tlacidla sa zmeni obrazok
    $('#buttons').on('click', '.btn-normal', currentDiv);

    // nacitanie tabulky miestnosti pre budovu Z
    $('.roomFrom').on('click', onDropdownBuildingItemClick('#nameOfBuildingFrom', 'roomFrom'));

    // nacitanie tabulky miestnosti pre budovu do
    $('.roomTo').on('click', onDropdownBuildingItemClick('#nameOfBuildingTo', 'roomTo'));

    // vyhladavanie v tabulkach
    $('#roomFrom-search-name').keyup(search('#roomFrom-search-name', '#table-roomFrom'));
    $('#roomTo-search-name').keyup(search('#roomTo-search-name', '#table-roomTo'));

    // nastavenie nazvu miestnoti po kliknuti
    $('#table-roomFrom').on('click', 'tbody tr', onRoomItemOfTable('#roomFrom'));
    $('#table-roomTo').on('click', 'tbody tr', onRoomItemOfTable('#roomTo'));

    //spustenie akcie pre hladanie najkratsiej cesty
    $('#submitPathSearch').on('click', pathSearch);

    // akcia po kliknuti na vrchol v tabulke najkratsej cety
    $('#table-pathSearcher').on('click', 'tbody tr td', onNodeItemOfTable);

});

function onNodeItemOfTable() {
    var node = $(this).data().item;
    setMapAndFloor(node.areal, node.poschodie);
    var x = node.suradnicaX;
    var y = node.suradnicaY;
    var pinWidth = 24;
    var pinHeight = 42;

    // musim pockat, az potom mozem skrolovat a nastavit bod
    setTimeout(function () {
        var bottomSliderHeight = 17;
        var heightMapWindows = $(".imgScroll").height() - bottomSliderHeight;
        var rightSliderWidth = 10;
        var widthtMapWindows = $(".imgScroll").width() - rightSliderWidth;
        $(".imgScroll").scrollTop(y - heightMapWindows / 2);
        $(".imgScroll").scrollLeft(x - widthtMapWindows / 2);

        // posunutie a zobrazenie bodu na spravnom mieste
        $("#mapPoint").css({ left: (x) + "px", top: (y + pinHeight/2) + "px" });
        $("#mapPoint").css('z-index', 50);
    }, 60);
}

// nastavenie konkretnej mapy po kliknuti v drop down menu
function onDropdownMapClick() {
    map = $(this).data().item;
    setMap(map, true, 1)
}

// nastavenie obrayku podla stlaceneho tlacidla
function currentDiv() {
    var position = $(this).data().item;
    showMap(position, true);
}

// zobrazi obrazok
function showMap(n, byIndex) {
    $("#mapPoint").css('z-index', -10);
    var i;
    var x = $(".mySlides");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    var button = $("#buttons .btn-normal-active");
    button.removeClass('btn-normal-active');
    $('#' + n).addClass('btn-normal-active');
    if (!byIndex) {          
        n = $('#' + n).data().item;
    }
    x[n - 1].style.display = "block";
}

/**  
 * Nacitanie miestnosti pre budovu z/do
 * 
 * @param {string} idNameOfBuilding identifikator span elemntu pre nazov budovy.
 * @param {string} idTableOfRooms identifikator tabulky pre ktoru sa aplikuje vykreslenie.
*/
// nacitanie tabulky miestnosti pre budovu Z
function onDropdownBuildingItemClick(idNameOfBuilding, idTableOfRooms) {
    return function () {
        var buildingID = $(this).data().item;
        var url = '/building/' + buildingID;
        $.ajax({
            method: 'get',
            url: url
        }).done(function (res) {
            //nastavenie textu a triedy pre budovu v hlavicke tabulky 
            $(idNameOfBuilding).empty();
            $(idNameOfBuilding).addClass('nameOfBuilding');
            $(idNameOfBuilding).append(res.nazov);
            //vymaze telo tabulky
            $('#table-' + idTableOfRooms + ' tbody').empty();
            //vymazanie input vyhladavania\
            $('#' + idTableOfRooms + '-search-name').val('');
            if (res.vrcholy && Array.isArray(res.vrcholy) && res.vrcholy.length > 0) {
                // pridanie miestnosti do tabulky
                res.vrcholy.forEach(function (element) {
                    //ak je to miestnost
                    var html = '<tr><td name="roomItem" class="text-center col-sm-10 col-xs-10" data-item="' + element.nazov + '">' + element.nazov + '</td></tr>';
                    var row = $(html);
                    row.data('item', element.nazov);
                    $('#table-' + idTableOfRooms + ' tbody').append(row);
                });
            }
        }).fail(function (res) {
            var message = '';
            if (res && res.responseJSON && Array.isArray(res.responseJSON.errors)) {
                if (res.responseJSON.errors.length > 0) {
                    res.responseJSON.errors.forEach(function (e) {
                        message += e.error + '<br/>';
                    });
                }
            }
            showErrorMessage(message || 'Nepodarilo sa načítať budovu.');
        });
    }

}

function onRoomItemOfTable(searchInput) {
    return function () {
        var room = $(this).data().item;
        $(searchInput + "-search-name").val(room);
        $(searchInput + "-search-name").focus();
    }

}

/**
 * Najdenie najkratsej cesty
 */
function pathSearch() {
    //kontrola vstupov
    if (!checkInputPathSearcher()) {
        return;
    }
    if (isLoading) {
		return;
	}
	isLoading = true;
    $('#submitPathSearch').html('<span class="fa fa-spinner fa-spin"></span> Hľadám');
    var data = {
        from: $('#roomFrom-search-name').val(),
        to: $('#roomTo-search-name').val()
    };
    var url = '/path';
    $.ajax({
        method: 'post',
        url: url,
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json'
    }).done(function (res) {
        createTableOfShortestPath(res);
    }).fail(function (res) {
        var message = '';
        if (res && res.responseJSON && Array.isArray(res.responseJSON.errors)) {
            if (res.responseJSON.errors.length > 0) {
                res.responseJSON.errors.forEach(function (e) {
                    message += e.error + '<br/>';
                    onAttributeError(e);
                });
            }
        }
        showErrorMessage('Nepodarilo sa najsť cestu');
    }).always(function () {
		$('#submitPathSearch').html('Vyhľadaj cestu');
		isLoading = false;
	});;
}

/**
 * Kontrola vstupov
 */
function checkInputPathSearcher() {
    $('#roomFrom-search-name').closest('.form-group').removeClass('has-error');
    $('#roomTo-search-name').closest('.form-group').removeClass('has-error');

    var check = true;
    var from = $('#roomFrom-search-name').val();
    var to = $('#roomTo-search-name').val();
    var roomsFrom = $('#table-roomFrom tbody tr').map(function () {
        return $(this).data().item;
    }).get();
    var roomsTo = $('#table-roomTo tbody tr').map(function () {
        return $(this).data().item;
    }).get();

    if (!from) {
        showErrorMessage('Vyberte miestnosť z');
        $('#roomFrom-search-name').closest('.form-group').addClass('has-error');
        return check = false;
    }
    if (roomsFrom.indexOf(from) < 0) {
        showErrorMessage('Vybrana miestnosť "z" neexistuje!');
        $('#roomFrom-search-name').closest('.form-group').addClass('has-error');
        return check = false;;
    }
    if (!to) {
        showErrorMessage('Vyberte miestnosť do');
        $('#roomTo-search-name').closest('.form-group').addClass('has-error');
        return check = false;;
    }
    if (roomsTo.indexOf(to) < 0) {
        $('#roomTo-search-name').closest('.form-group').addClass('has-error');
        return check = false;
    }
    return check;
}

function createTableOfShortestPath(path) {
    if (path && Array.isArray(path) && path.length > 0) {
        //vymazane tabulky a popisu
        $('#table-pathSearcher').empty();
        $('#shortestPath-name').empty();
        //popis najrkatsiej cesty + generovanie hlavicky a tela tabulky
        $('#shortestPath-name').append("Najkratšia cesta z " + path[0].nazov + " do " + path[path.length - 1].nazov);
        var html = '<thead></thead><tbody class="scrollbarStyle table-bordered"></tbody>';
        var row = $(html);
        $('#table-pathSearcher').append(row);
        html = '<tr><th class="text-center col-sm-6 col-xs-6">Vrchol z</th><th class="text-center col-sm-6 col-xs-6">Vrchol do</th></tr>';
        row = $(html);
        $('#table-pathSearcher thead').append(row);
        for (var i = 1; i < path.length; i++) {
            row = $('<tr></tr>');
            var nodeFrom = $('<td class="text-center 6 col-xs-6" data-item="' + path[i - 1] + '">' + path[i - 1].nazov + '</td>');
            var nodeTo = $('<td class="text-center 6 col-xs-6" data-item="' + path[i] + '">' + path[i].nazov + '</td>');
            nodeFrom.data('item', path[i - 1]);
            nodeTo.data('item', path[i]);
            row.append(nodeFrom);
            row.append(nodeTo);
            $('#table-pathSearcher tbody').append(row);
        };
    } else {
        showErrorMessage('Cesta nexistuje! Skontrolujte prosím vtupy.');
        $('#roomFrom-search-name').closest('.form-group').addClass('has-error');
        $('#roomTo-search-name').closest('.form-group').addClass('has-error');
    }
}

/**
 * Nastavenie mapy podla 
 * param object - objekt mapy obsahujuci data
 * @param {object} object objekt mapy obsahujuci data
 * @param {boolean} byIndex parameter rozhoduje o sposebe zobrazenia mapy
 */
function setMap(object, byIndex, floor) {
    var map = object;
    // zmen nazov mapy
    $('#map-name').text(map.nazov);

    // pridanie tlacidiel pre poschodia
    $('#buttons').empty();
    $('.imgScroll').empty();
    var mapPoint = $('<i id="mapPoint" class="mapPoint fa fa-dot-circle-o faa-pulse animated fa-2x "></i>');
    $('.imgScroll').append(mapPoint);
    if (map.poschodia && Array.isArray(map.poschodia) && map.poschodia.length > 0) {
        var i = 1;
        map.poschodia.forEach(function (element) {
            var html = '<button id="' + (byIndex ? i : element.cislo) + '" class="btn btn-normal margin" data-item=' + i + '>' + element.cislo + ' </button>';
            var row = $(html);
            row.data('item', i);
            $('#buttons').append(row);
            i++;
        });
        // pridanie obrazkov map pre poschodia 
        map.poschodia.forEach(function (element) {
            var html = '<img class="mySlides" src="' + element.url + '">';
            var row = $(html);
            $('.imgScroll').append(row);
        });
    } else {
        var html = '<img class="mySlides" src="' + map.url + '">';
        var row = $(html);
        $('.imgScroll').append(row);
    }
    
    // nastavenie prveho obrazku 
    showMap(floor, byIndex);
}

/** 
 * Nastavi mapu a poschodie.
 *  @param {string} name nazov hladanej mapy
 *  @param {int} floor poschodie
 */
function setMapAndFloor(name, floor) {
    var url = '/map/' + name;
    $.ajax({
        method: 'get',
        url: url
    }).done(function (res) {
        setMap(res, false, floor)
    }).fail(function (res) {
        var message = '';
        if (res && res.responseJSON && Array.isArray(res.responseJSON.errors)) {
            if (res.responseJSON.errors.length > 0) {
                res.responseJSON.errors.forEach(function (e) {
                    message += e.error + '<br/>';
                });
            }
        }
        showErrorMessage(message || 'Nepodarilo sa načítať budovu.');
    });
}
