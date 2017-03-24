var isLoading = false;
$(document).ready(function () {

    // zobrazi bod na map pre existujuci vrchol grafu.
    showPointOnExistingNode($('#node-object').data().item);

    // vyhladavanie v tabulkách
    $('#node-search-name').keyup(search('#node-search-name', '#table-nodes'));
    $('#adjancet-node-search-name').keyup(search('#adjancet-node-search-name', '#table-adjancet-nodes'));
    $('#adjancet-node-search-name-detail').keyup(search('#adjancet-node-search-name-detail', '#table-adjancet-nodes-detail'));


    // Vytvorenie noveho vrcholu v grave so vsetkymi susednimi vrcholmi alebo aktualizacia existujuceho
    $('#submit-node').on('click', onSubmitNodeClick);
    // restart hodnot
    $('#cancel-node').on('click', onCancelClick);
    // Odstranenie existujuceho vrcholu v grafe
    $('#delete-node').on('click', onNodeDeleteClik);


    // nastavenie map pre areal
    $('.areal-map').on('click', onDropdownMapClick(false));

    // podla slaceneho tlacidla sa zmeni mapa
    $('#buttons').on('click', '.btn-normal', currentDiv);

    // akcia po kliknuti na riadok v tabulke vrcholov
    $('#table-nodes').on('click', 'tbody tr', onNodeRowOfTable(false));


    // Zobrazenie detailu existujuceho susedneho vrcholu
    $('#table-adjancet-nodes tbody').on('click', '.adjancet-node-detail', onTableAdjancetNodeClick);

    // Skrytie modalneho okna pre detail susedneho vrcholu  - restart hodnot
    $('#adjancet-node-modal').on('hidden.bs.modal', onHideModalAdjancetNode);

    // Po kliknuti na pridanie susendneho vrcholu nastavenie grafickej oblasti a vyprazdnenie tabulky v detaile
    $('#adjancet-node-new').on('click', onNewAdjancetNodeClick);

    //Vytvorenie noveho susedneho vrcholu alebo aktualizacia existujuceho
    $('#submit-adjancet-node').on('click', onSubmitAdjancetNodeClick);

    // Odstranenie susedneho vrcholu z tabulky
    $('#delete-adjancet-node').on('click', onDeleteAdjancetNodeClik);


    // podla slaceneho tlacidla sa zmeni mapa v detaile susedneho vrchlu
    $('#adjancet-node-buttons').on('click', '.btn-normal', currentButtonAdjancetNodeDetail);

    // nastavenie map pre area v detaile susedneho vrcholu
    $('.adjancet-node-areal-map').on('click', onDropdownMapClick(true));

    // akcia po kliknuti na riadok v tabulke  vrcholov
    $('#table-adjancet-nodes-detail').on('click', 'tbody tr', onNodeRowOfTable(true));
});

/**
 * Zobrazi bod na mape a vyberie poschodie pre existujuci vrchol grafu
 */
function showPointOnExistingNode(node) {
    if (node) {
        var x = node.suradnicaX;
        var y = node.suradnicaY;
        var pinWidth = 24;
        var pinHeight = 42;

        var map = $('.areal-map').map(function () {
            return $(this).data().item
        }).get().find(x => x.nazov === $('#graf-node-areal').val());

        setMap(map, false, node.poschodie, '#buttons', '#map-window', 'mapPoint');
        // musim pockat, az potom mozem skrolovat a nastavit bod
        setTimeout(function () {
            var bottomSliderHeight = 17;
            var heightMapWindows = $(".imgScroll").height() - bottomSliderHeight;
            var rightSliderWidth = 10;
            var widthtMapWindows = $(".imgScroll").width() - rightSliderWidth;
            $(".imgScroll").scrollTop(y - heightMapWindows / 2);
            $(".imgScroll").scrollLeft(x - widthtMapWindows / 2);

            // posunutie a zobrazenie bodu na spravnom mieste
            $("#mapPoint").css({ left: (x) + "px", top: (y + pinHeight / 2) + "px" });
            $("#mapPoint").css('z-index', 3000);
        }, 60);
    }
}

/**
 * Vytvorenie noveho vrcholu v grave so vsetkymi susednimi vrcholmi alebo aktualizacia existujuceho.
 */
function onSubmitNodeClick() {
    if (isLoading) {
        return;
    }
    isLoading = true;
    $('#graf-node-areal').closest('.form-group').removeClass('has-error');
    $('#node-graf-name').closest('.form-group').removeClass('has-error');
    $('#error').html('');
    $('#submit-node').html('<span class="fa fa-spinner fa-spin"></span> Ukladám');
    var url = '/nodes';
    var id = $('#node-id').val();
    if (id) {
        url += ('/' + id);
    }
    var method = id ? 'PUT' : 'POST';
    var data = composeRequestData();
    $.ajax({
        method: method,
        url: url,
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json'
    }).done(function (res) {
        window.location.assign('/nodes/' + res.id);
    }).fail(function (res) {
        if (res && res.responseJSON && Array.isArray(res.responseJSON.errors)) {
            if (res.responseJSON.errors.length > 0) {
                var html = '<div class="alert alert-danger" role="alert">';
                res.responseJSON.errors.forEach(function (e) {
                    html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
                    html += '<span class="sr-only">Chyba:</span> ' + e.error + '<br />';
                    onAttributeError(e);
                });
                html += '</div>';
                $('#error').html(html);
            }
        }
    }).always(function () {
        $('#submit-node').html('Uložiť');
        isLoading = false;
    });
}

/**
 * Zrusenie
 */
function onCancelClick() {
    location.href = '/graf/';
}


// odstranenie clena kapely
function onNodeDeleteClik() {
    if (!$('#confirm-delete-node').is(':visible')) {
        $('#submit-node').prop('disabled', true);
        $('#confirm-delete-node').show();
        return;
    }
    if (isLoading) {
        return;
    }
    isLoading = true;
    $('#error').html('');
    $('#delete-node').html('<span class="fa fa-spinner fa-spin""></span> Odstraňujem');
    var id = $('#node-id').val();
    console.log(id);
    var url = '/nodes/' + id;
    $.ajax({
        method: 'DELETE',
        url: url,
        dataType: 'json'
    }).done(function () {
        location.href = '/nodes/';
    }).fail(function (res) {
        var message = '';
        if (res && res.responseJSON && Array.isArray(res.responseJSON.errors)) {
            if (res.responseJSON.errors.length > 0) {
                res.responseJSON.errors.forEach(function (e) {
                    message += e.error + '<br/>';
                });
            }
        }
        showErrorMessage(message || ' Nepodarilo sa odstrániť vrchol v grafe.');
    }).always(function () {
        $('#delete-node').html('Odstrániť');
        isLoading = false;
    });
}

// nastavenie konkretnej mapy po kliknuti v drop down menu
function onDropdownMapClick(inModal) {
    return function () {
        map = $(this).data().item;

        if (inModal) {
            // nastavenie nazvu arealu
            $('#adjancet-node-areal-name').val(map.nazov);

            // vyprazdni input pre vybrany vrchol
            $('#adjancet-node-search-name-detail').val('');

            // vypise tabulku dostupnych vrcholov pre areal
            setTableOfNodesForAreal(map.id, '#nameOfArealInModal', 'adjancet-nodes-detail');

            // nastaví mapu
            setMap(map, true, 1, '#adjancet-node-buttons', '#adjancet-node-map-window', 'adjancetNodeMapPoint');

        } else {
            // nastavenie nazvu arealu
            $('#graf-node-areal').val(map.nazov);

            // vyprazdni input pre vybrany vrchol
            $('#node-search-name').val('');

            // vypise tabulku dostupnych vrcholov pre areal
            setTableOfNodesForAreal(map.id, '#nameOfAreal', 'nodes');

            // nastaví mapu
            setMap(map, true, 1, '#buttons', '#map-window', 'mapPoint')
        }
    }
}

/**  
 * Nacitanie vrcholov pre areal.
 * 
 * @param {string} idNameOfBuilding identifikator span elemntu pre nazov arealu.
 * @param {string} idTableOfRooms identifikator tabulky pre ktoru sa aplikuje vykreslenie.
*/
function setTableOfNodesForAreal(arealID, idNameOfArealSpan, idTableName) {
    var url = '/nodesAreal/' + arealID;
    $.ajax({
        method: 'get',
        url: url
    }).done(function (res) {
        //nastavenie textu a triedy pre areal v hlavicke tabulky 
        $(idNameOfArealSpan).empty();
        $(idNameOfArealSpan).addClass('nameOfBuilding');
        $(idNameOfArealSpan).append(res.nazov);
        //vymaze telo tabulky
        $('#table-' + idTableName + ' tbody').empty();

        if (res.vrcholy && Array.isArray(res.vrcholy) && res.vrcholy.length > 0) {
            // pridanie vrcholov do tabulky
            res.vrcholy.forEach(function (element) {
                var html = '<tr name="node-row" data-item="' + element + '">' +
                    '<td name="nodes" class="text-center col-sm-4 col-xs-4">' + (element.poschodie === 0 || element.poschodie ? element.poschodie : '-') + '</td>' +
                    '<td name="nodes" class="text-center col-sm-4 col-xs-4">' + element.nazov + '</td>' +
                    '<td name="nodes" class="text-center col-sm-4 col-xs-4">' + element.typ + '</td>' +
                    '</tr>';
                var row = $(html);
                row.data('item', element);
                $('#table-' + idTableName + ' tbody').append(row);
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
        showErrorMessage(message || 'Nepodarilo sa načítať areál.');
    });
}

/**
 * Nastavenie mapy podla 
 * param object - objekt mapy obsahujuci data
 * @param {object} object objekt mapy obsahujuci data
 * @param {boolean} byIndex parameter rozhoduje o sposebe zobrazenia mapy
 */
function setMap(object, byIndex, floor, idButtons, idMapWindow, idMapPoint) {
    var map = object;

    // pridanie tlacidiel pre poschodia
    $(idButtons).empty();
    $(idMapWindow).empty();
    var mapPoint = $('<i id="' + idMapPoint + '" class="mapPoint fa fa-dot-circle-o faa-pulse animated fa-2x "></i>');
    $(idMapWindow).append(mapPoint);
    $(idMapWindow).addClass("imgScroll");
    if (map.poschodia && Array.isArray(map.poschodia) && map.poschodia.length > 0) {
        var i = 1;
        map.poschodia.forEach(function (element) {
            var html = '<button id="' + (byIndex ? i : element.cislo) + '" class="btn btn-normal margin" data-item=' + i + '>' + element.cislo + ' </button>';
            var row = $(html);
            row.data('item', i);
            $(idButtons).append(row);
            i++;
        });
        // pridanie obrazkov map pre poschodia 
        map.poschodia.forEach(function (element) {
            var html = '<img class="mySlides" src="' + element.url + '">';
            var row = $(html);
            $(idMapWindow).append(row);
        });
    } else {
        var html = '<img class="mySlides" src="' + map.url + '">';
        var row = $(html);
        $(idMapWindow).append(row);
    }

    // nastavenie prveho obrazku 
    showMap(floor, byIndex, idMapPoint, idMapWindow, idButtons);
}

// zobrazi obrazok
function showMap(n, byIndex, idMapPoint, idMapWindow, idButtons) {
    //console.log(idButtons);
    $("#" + idMapPoint).css('z-index', -10);
    var x = $(idMapWindow + " .mySlides");
    for (var i = 0; i < x.length; i++) {
        $(x[i]).removeClass("active");
        x[i].style.display = "none";
    }

    var button = $(idButtons + " .btn-normal-active");
    button.removeClass('btn-normal-active');
    if (!byIndex) {
        $(idButtons + ' #' + n).addClass('btn-normal-active');
        n = $(idButtons + ' #' + n).data().item;
    } else {
        var buttons = $(idButtons).children();
        $(buttons[n - 1]).addClass('btn-normal-active');
    }
    $(x[n - 1]).addClass("active");
    x[n - 1].style.display = "block";
}

// nastavenie obrazku podla stlaceneho tlacidla
function currentDiv() {
    var position = $(this).data().item;
    showMap(position, true, 'mapPoint', '#map-window', '#buttons');
}

// metoda nastavi a zobrazi  vrchol na mape.
function onNodeRowOfTable(inModal) {
    return function () {

        if (inModal) {
            var idNodeName = "#adjancet-node-name";
            var idArealName = "#adjancet-node-areal-name";
            var idSearchName = "#adjancet-node-search-name-detail";
            var idMapPoint = 'adjancetNodeMapPoint';
            var idButtons = '#adjancet-node-buttons';
            var idMapWindow = '#adjancet-node-map-window';
        } else {
            var idNodeName = "#node-graf-name";
            var idArealName = "#graf-node-areal";
            var idSearchName = "#node-search-name";
            var idMapPoint = 'mapPoint';
            var idButtons = '#buttons';
            var idMapWindow = '#map-window';
        }

        var node = $(this).data().item;
        if (node) {
            // nastavim inptu pra nazov vrcholu grafu 
            $(idNodeName).val(node.nazov);

            setMapAndFloor($(idArealName).val(), node.poschodie, idButtons, idMapWindow, idMapPoint);
            $(idSearchName).val(node.nazov);
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
                $("#" + idMapPoint).css({ left: (x) + "px", top: (y + pinHeight / 2) + "px" });
                $("#" + idMapPoint).css('z-index', 50);
            }, 60);
        }
    }
}

/** 
 * Nastavi mapu a poschodie.
 *  @param {string} name nazov hladanej mapy
 *  @param {int} floor poschodie
 */
function setMapAndFloor(name, floor, idButtons, idMapWindow, idMapPoint) {
    var url = '/map/' + name;
    $.ajax({
        method: 'get',
        url: url
    }).done(function (res) {
        setMap(res, false, floor, idButtons, idMapWindow, idMapPoint)
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

/** 
 *  Nastavi polohu susedneho bodu na mape v detaile susedneho vrchola.
 *  @param {string} arealName nazov arealu
 *  @param {string} nodeName nazov vrchlu
 */
function setAdjancetNodeAndMapsInDetail(arealName, nodeName) {
    var url = '/nodeAreal' + '?arealName=' + arealName + '&nodeName=' + nodeName;
    $.ajax({
        method: 'get',
        url: url
    }).done(function (res) {
        if (res) {
            var x = res.suradnicaX;
            var y = res.suradnicaY;
            var pinWidth = 24;
            var pinHeight = 42;

            var map = $('.adjancet-node-areal-map').map(function () {
                return $(this).data().item
            }).get().find(x => x.nazov === $('#adjancet-node-areal-name').val());
            setMap(map, false, res.poschodie, '#adjancet-node-buttons', '#adjancet-node-map-window', 'adjancetNodeMapPoint');
            // musim pockat, az potom mozem skrolovat a nastavit bod
            setTimeout(function () {
                var bottomSliderHeight = 17;
                var heightMapWindows = $("#adjancet-node-map-window").height() - bottomSliderHeight;
                var rightSliderWidth = 10;
                var widthtMapWindows = $("#adjancet-node-map-window").width() - rightSliderWidth;
                $("#adjancet-node-map-window").scrollTop(y - heightMapWindows / 2);
                $("#adjancet-node-map-window").scrollLeft(x - widthtMapWindows / 2);

                // posunutie a zobrazenie bodu na spravnom mieste
                $("#adjancetNodeMapPoint").css({ left: (x) + "px", top: (y + pinHeight / 2) + "px" });
                $("#adjancetNodeMapPoint").css('z-index', 3000);
            }, 200);
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
        showErrorMessage(message || 'Nepodarilo sa načítať vrchol.');
    });
}

/**
 * Nastavenie hodnot pre existujuci susedny vrchol.  
 */
function onTableAdjancetNodeClick() {

    var nodeTable = $(this).data().item;
    var index = $(this).index();
    // Zakladne
    $('#delete-adjancet-node').show();
    $('.modal-adjancet-node-title').html(nodeTable.nazov || 'Detail&nbsp;vrcholu');
    $('#adjancet-node-id').val(index);

    // Nazov susedneho vrcholu
    $('#adjancet-node-name').val(nodeTable.nazov || '');

    // Vzdialenost do vrcholu vrcholu 
    $("#adjancet-node-price").val(nodeTable.cena || '');

    // Nazov arealu
    $("#adjancet-node-areal-name").val(nodeTable.areal || '');

    setAdjancetNodeAndMapsInDetail(nodeTable.areal, nodeTable.nazov);
}

/**
 * Adstranenie oblasti pre mapu a vzprazdnenei tabulky.  
 */
function onNewAdjancetNodeClick() {


    //odstranenie tlačiciel 
    $('#adjancet-node-buttons').empty();

    // odstranenie oblasi mapy
    $('#adjancet-node-map-window').empty();
    $('#adjancet-node-map-window').removeClass("imgScroll");

    //vymaze telo tabulky
    $('#table-adjancet-nodes-detail tbody').empty();

    //nastavenie textu a triedy pre areal v hlavicke tabulky 
    $('#nameOfArealInModal').empty();
    $('#nameOfArealInModal').removeClass('nameOfBuilding');
}

/**
 * Vytvorenie noveho vrcholu alebo aktualizacia existujuceho
 */
function onSubmitAdjancetNodeClick() {
    // Schovam chybove hlasenia
    $('#adjancet-node-error').html('');
    $('#adjancet-node-name').closest('.form-group').removeClass('has-error');
    $('#adjancet-node-price').closest('.form-group').removeClass('has-error');
    $('#adjancet-node-areal-name').closest('.form-group').removeClass('has-error');
    var index = $('#adjancet-node-id').val();
    if (index) {
        updateAdjancetNode(index);
    } else {
        addAdjancetNode();
    }

}

/**
 * Pridanie noveho susedneho vrcholu
 */
function addAdjancetNode() {
    var node = {
        nazov: ($('#adjancet-node-name').val()).trim(),
        areal: $("#adjancet-node-areal-name").val(),
        cena: $("#adjancet-node-price").val(),
    };
    var cena = !isNaN(node.cena);
    if (node.nazov && node.areal && cena !== false) {

        if (checkItemExistInTable('#table-adjancet-nodes', node)) {
            $('#adjancet-node-name').closest('.form-group').addClass('has-error');
            showErrorMessage('Zadaný vrchol už existuje.');
            return;
        }

        var countRows = $("#table-adjancet-nodes tbody tr").length;
        if (countRows === 0) {
            $('#table-adjancet-nodes').show();
            $('#adjancet-node-empty').hide();
        }
        cena.node = parseFloat(cena);
        var html = '<tr class="adjancet-node-detail"  data-toggle="modal" data-target="#adjancet-node-modal">' +
            '<td class="text-center">' + node.nazov + '</td>' +
            '</tr>';
        var row = $(html);
        row.data('item', node);
        $('#table-adjancet-nodes tbody').append(row);
        $('#adjancet-node-modal').modal('toggle');
    } else {
        var html = '<div class="alert alert-danger" role="alert">';
        if (node.nazov == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Vyberte vrchol z tabulky.<br />';
            $('#adjancet-node-name').closest('.form-group').addClass('has-error');
        }
        if (node.areal == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Vyberte areál.<br />';
            $('#adjancet-node-areal-name').closest('.form-group').addClass('has-error');
        }
        if (cena === false) {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Zadajte vzdialenosť v spravnom tvare.<br />';
            $('#adjancet-node-price').closest('.form-group').addClass('has-error');
        }
        html += '</div>';
        $('#adjancet-node-error').html(html);
    }

    //scroll and of table
    var countRows = $("#table-adjancet-nodes tbody tr").length + 1;
    var heightRow = $("#table-adjancet-nodes tbody tr").height();
    $("#table-adjancet-nodes tbody").scrollTop(countRows * heightRow);
}


/**
 * Aktualizacia susedneho vrcholu 
 */
function updateAdjancetNode(index) {

    var node = {
        nazov: ($('#adjancet-node-name').val()).trim(),
        areal: $("#adjancet-node-areal-name").val(),
        cena: $("#adjancet-node-price").val(),
    };
    var cena = !isNaN(node.cena);
    if (node.nazov && node.areal && cena !== false) {
        if (checkUpdateItemInTable('#table-adjancet-nodes', node, index)) {
            $('#adjancet-node-name').closest('.form-group').addClass('has-error');
            showErrorMessage('Zadaný vrchol už existuje.');
            return;
        }
        cena.node = parseFloat(cena);
        var html = '<td class="text-center">' + node.nazov + '</td>';
        var row = $('#table-adjancet-nodes tbody tr').eq(index).html(html);
        row.data('item', node);
        $('#adjancet-node-modal').modal('toggle');
    } else {
        var html = '<div class="alert alert-danger" role="alert">';
        if (node.nazov == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Vyberte vrchol z tabulky.<br />';
            $('#adjancet-node-name').closest('.form-group').addClass('has-error');
        }
        if (node.areal == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Vyberte areál.<br />';
            $('#adjancet-node-areal-name').closest('.form-group').addClass('has-error');
        }
        if (cena === false) {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Zadajte vzdialenosť v spravnom tvare.<br />';
            $('#adjancet-node-price').closest('.form-group').addClass('has-error');
        }
        html += '</div>';
        $('#adjancet-node-error').html(html);
    }
}

/**
 *  Odstranenie susedneho vrcholu 
 */
function onDeleteAdjancetNodeClik() {
    if (!$('#confirm-delete-adjancet-node').is(':visible')) {
        $('#submit-adjancet-node').prop('disabled', true);
        $('#confirm-delete-adjancet-node').show();
        return;
    }

    var index = $('#adjancet-node-id').val();
    var row = $('#table-adjancet-nodes tbody tr').eq(index).remove();

    var countRows = $("#table-adjancet-nodes tbody tr").length;
    if (countRows === 0) {
        $('#table-adjancet-nodes').hide();
        $('#adjancet-node-empty').show();
    }
    $('#adjancet-node-modal').modal('toggle');
}

/**
 * Skrytie modalneho okna pre vrchol- restart hodnot.  
 */
function onHideModalAdjancetNode() {

    // Schovam chybove hlasenia
    $('#adjancet-node-error').html('');
    $('#adjancet-node-name').closest('.form-group').removeClass('has-error');
    $('#adjancet-node-price').closest('.form-group').removeClass('has-error');
    $('#adjancet-node-areal-name').closest('.form-group').removeClass('has-error');

    // Zakladne
    $('#confirm-delete-adjancet-node').hide();
    $('#delete-adjancet-node').hide();
    $('#submit-adjancet-node').prop('disabled', false);
    $('#adjancet-node-id').val('');
    $('.modal-adjancet-node-title').html('Nový&nbsp;vrchol');

    // Nazov susedneho vrcholu
    $('#adjancet-node-name').val('');

    // Vzdialenost do vrcholu vrcholu 
    $('#adjancet-node-price').val('');

    // Nazov arealu
    $("#adjancet-node-areal-name").val('');

    // Input pre vyhladavanie v tabulke
    $('#adjancet-node-search-name-detail').val('');
}

// nastavenie obrazku podla stlaceneho tlacidla v detaile susedneho vrchlu
function currentButtonAdjancetNodeDetail() {
    var position = $(this).data().item;
    showMap(position, true, 'adjancetNodeMapPoint', '#adjancet-node-map-window', '#adjancet-node-buttons');
}

/**
 *  Kotrloje či sa vkladana položka už nacháza v tabulke
 */
function checkItemExistInTable(tableId, item) {
    var items = $(tableId + ' tbody tr').map(function () {
        return $(this).data().item;
    }).get();
    switch (tableId) {
        case '#table-adjancet-nodes':
            return items.findIndex(e => e.nazov === item.nazov) >= 0;
        default:
            return false;
    }
}

/**
 *  Kotrloje či sa update-ovana polozka nachadza v tabulke
 */
function checkUpdateItemInTable(tableId, item, index) {
    var items = $(tableId + ' tbody tr').map(function () {
        return $(this).data().item;
    }).get();

    if (items && items.length > 0) {
        //odstranenie položky pre aktualizaciu z kotrolovaneho poľa
        items.splice(index, 1);
        switch (tableId) {
            case '#table-adjancet-nodes':
                return items.findIndex(e => e.nazov === item.nazov) >= 0;
            default:
                return false;
        }
    }
    return false;
}

/**
 * Nastavenie chyby pri polozke vo formulari.
 */
function onAttributeError(e) {
    switch (e.name) {
        case 'areal':
            $('#graf-node-areal').closest('.form-group').addClass('has-error');
            break;
        case 'nazov':
            $('#node-graf-name').closest('.form-group').addClass('has-error');
            break;
        case 'alreadyExists':
            $('#node-graf-name').closest('.form-group').addClass('has-error');
            $('#graf-node-areal').closest('.form-group').addClass('has-error');
            break;
    }
}

/**
 * Zostavenie dat pre request - vytvorenie / aktualizacia zaznamu.
 */

function composeRequestData() {
    var data = {
        nazov: $('#node-graf-name').val(),
        areal: $('#graf-node-areal').val(),
        susedneVrcholy: $('#table-adjancet-nodes tbody tr').map(function () {
            return $(this).data().item
        }).get()
    };
    return data;
}