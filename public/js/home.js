var slideIndex = 1;
$(document).ready(function () {	
    
    // nastavenie nazvu mapy
    $('.map').on('click', onDropdownMapClick);    
    // podla slaceneho tlacidla sa zmeni obrazok
    $('#buttons').on('click', '.btn-normal', currentDiv);
    // nacitanie tabulky miestnosti pre budovu Z
    $('.roomFrom').on('click', onDropdownBuildingItemClick('#nameOfBuildingFrom', '#table-roomFrom'));
    // nacitanie tabulky miestnosti pre budovu do
    $('.roomTo').on('click', onDropdownBuildingItemClick('#nameOfBuildingTo', '#table-roomTo'));
    // vyhladavanie v tabulkach
    $("#roomFrom-search-name").keyup(search('#roomFrom-search-name', '#table-roomFrom'));
    $("#roomTo-search-name").keyup(search('#roomTo-search-name', '#table-roomTo'));
    
    // nastavenie nazvu miestnoti po kliknuti
    $('#table-roomFrom').on('click', 'tbody tr', onRoomItemOfTable('#roomFrom')); 
    $('#table-roomTo').on('click', 'tbody tr', onRoomItemOfTable('#roomTo'));   
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
        var building = $(this).data().item;
        //nastavenie textu a triedy pre budovu v hlavicke tabulky 
        $(idNameOfBuilding).empty();
        $(idNameOfBuilding).addClass('nameOfBuilding');
        $(idNameOfBuilding).append(building.nazov);
        //vymaze telo tabulky
        $(idTableOfRooms + ' tbody').empty();
        if (building.vrcholy && Array.isArray(building.vrcholy) && building.vrcholy.length > 0) {
            // pridanie miestnosti do tabulky
            building.vrcholy.forEach(function (element) {
                //ak je to miestnost
                var html = '<tr><td name="roomItem" class="text-center col-sm-10 col-xs-10" data-item="' + element.nazov + '">' + element.nazov + '</td></tr>';
                var row = $(html);
                row.data('item', element.nazov);
                $(idTableOfRooms + ' tbody').append(row);
            });
        }
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