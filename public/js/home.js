var slideIndex = 1;
$(document).ready(function () {	
    
    // nastavenie nazvu mapy
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

/**
 * Nastavenie nazu mapy
 */
function onDropdownMapClick() {
    // zmen nazov mapy
    var map = $(this).data().item;  
    $('#map-name').text(map.nazov); 
      
    // pridanie tlacidiel pre poschodia
    $('#buttons').empty();
    $('.imgScroll').empty();
    if (map.poschodia && Array.isArray(map.poschodia) && map.poschodia.length > 0) {
        var i = 1;
        map.poschodia.forEach(function (element) {
            var html = '<button class="btn btn-normal" data-item=' + i + '>' + element.cislo + ' </button>';
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
    showDivs(1);
}

// nastavenie obrayku podla stlaceneho tlacidla
function currentDiv() {
    var position = $(this).data().item;
    showDivs(slideIndex = position);
}

// zobrazi obrazok
function showDivs(n) {
    var i;
    var x = $(".mySlides");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
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
    return function() {
        var buildingID = $(this).data().item._id;
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

/**  
 * Vyhlavanie v tabulku
 * 
 * @param {string} searchInput identifikator input elementu.
 * @param {string} tableBody identifikator tabulky pre ktoru sa aplikuje vyhladavanie.
*/ 
function search(searchInput, tableBody){
    return function(){
        var searchTerm = $(searchInput).val();
        var listItem = $('.results tbody').children('tr');
        var searchSplit = searchTerm.replace(/ /g, "'):containsi('");
    
        $.extend($.expr[':'], {'containsi': function(elem, i, match, array){
            return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
        }
        });
    
        $(tableBody + " tbody tr").not(":containsi('" + searchSplit + "')").each(function(e){
            $(this).attr('visible','false');
        });

        $(tableBody + " tbody tr:containsi('" + searchSplit + "')").each(function(e){
            $(this).attr('visible','true');
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
    if(!checkInputPathSearcher()){
        return;
    }
    var data ={
        from: $('#roomFrom-search-name').val(),
        to: $('#roomTo-search-name').val()
    };
    var url = '/graf';
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
	});
}

/**
 * Kontrola vstupov
 */
function checkInputPathSearcher(){
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
    
    if(!from){
        showErrorMessage('Vyberte miestnosť z');
        $('#roomFrom-search-name').closest('.form-group').addClass('has-error');
        return check = false;
    }
    if(roomsFrom.indexOf(from) < 0){
        showErrorMessage('Vybrana miestnosť "z" neexistuje!');
        $('#roomFrom-search-name').closest('.form-group').addClass('has-error');
        return check = false;;
    }
    if(!to){
        showErrorMessage('Vyberte miestnosť do');
        $('#roomTo-search-name').closest('.form-group').addClass('has-error');
        return check = false;;
    }
    if(roomsTo.indexOf(to) < 0){
        $('#roomTo-search-name').closest('.form-group').addClass('has-error');
        return check = false;
    }   
    return check;
}

function createTableOfShortestPath(path) {
    if(path && Array.isArray(path) && path.length > 0){           
            //vymazane tabulky a popisu
            $('#table-pathSearcher').empty();
            $('#shortestPath-name').empty();   
            //popis najrkatsiej cesty + generovanie hlavicky a tela tabulky
            $('#shortestPath-name').append("Najkratšia cesta z " + path[0].vrchol + " do " + path[path.length-1].vrchol);
            var html = '<thead></thead><tbody class="scrollbarStyle table-bordered"></tbody>';
            var row = $(html);  
            $('#table-pathSearcher').append(row);
            html = '<tr><th class="text-center col-sm-6 col-xs-6">Vrchol z</th><th class="text-center col-sm-6 col-xs-6">Vrchol do</th></tr>';                     
            row = $(html);
            //row.data('item', element.nazov);
            $('#table-pathSearcher thead').append(row); 
            for(var i = 1; i < path.length; i++){
               html = '<tr><td class="text-center 6 col-xs-6" data-item="' + JSON.stringify(path[i-1]) + '">' + path[i-1].vrchol + '</td><td class="text-center 6 col-xs-6" data-item="' + JSON.stringify(path[i]) + '">' + path[i].vrchol + '</td></tr>';
               row = $(html); 
               $('#table-pathSearcher tbody').append(row);
            };
        }else {
            showErrorMessage('Cesta nexistuje! Skontrolujte prosím vtupy.');
            $('#roomFrom-search-name').closest('.form-group').addClass('has-error');
            $('#roomTo-search-name').closest('.form-group').addClass('has-error');
        }
}

function onNodeItemOfTable() {
    //toDo: neche mi ulozit objekt do html tagu td ...konkretne data-item
    var node = $(this).data().item;  
    console.log(node);
    alert(node);
}