var isLoading = false;
$(document).ready(function () {

    initializeImageUpload();

    // nastavenie obsahu po nacitani stranky
    setContent();

    // podla slaceneho tlacidla sa zmeni obrazok
    $('#buttons').on('click', '.btn-normal', currentMap);

    // nastavenie obsahu po cliknuti na prepinac
    $('input[name=switch]', '.switch-field').on('click', setContent);

    // vyhladavanie v tabulke vrcholov
    $('#node-search-name').keyup(search('#node-search-name', '#table-nodes'));


    // Vytvorenie noveho arealu alebo aktualizacia existujuceho
    $('#submit-areal').on('click', onSubmitArealClick);
    // restart hodnot
    $('#cancel-areal').on('click', onCancelClick);
    // Odstranenie existujuceho vrcholu
    $('#delete-areal').on('click', onArealDeleteClik);


    // Skrytie modalneho okna pre detail vrcholu  - restart hodnot
    $('#node-modal').on('hidden.bs.modal', onHideModalNode);

    // Po kliknuti na pridanie vrcholu nastavenie grafickej oblasi v detaile
    $('#node-new').on('click', onNewNodeClick);

    // Zobrazenie detailu existujuceho vrcholu
    $('#table-nodes tbody').on('click', '.node-detail', onTableNodeClick);

    //Vytvorenie noveho vrcholu alebo aktualizacia existujuceho
    $('#submit-node').on('click', onSubmitNodeClick);

    // Odstranenie  vrcholu z tabulky
    $('#delete-node').on('click', onDeleteNodeClik);


    // Skrytie modalneho okna pre detail poschodia  - restart hodnot
    $('#floor-modal').on('hidden.bs.modal', onHideModalFloor);

    // Zobrazenie detailu existujuceho poschodia
    $('#table-floors tbody').on('click', '.floor-detail', onTableFloorClick);

    //Vytvorenie noveho poschodia alebo aktualizacia existujuceho
    $('#submit-floor').on('click', onSubmitFloorClick);

    // Odstranenie  poschodia z tabulky
    $('#delete-floor').on('click', onDeleteFloorClik);
});

/**
 * Vytvorenie noveho arealu alebo aktualizacia existujuceho.
 */
function onSubmitArealClick() {
    if (isLoading) {
        return;
    }
    isLoading = true;
    $('#areal-name').closest('.form-group').removeClass('has-error');
    $('#error').html('');
    $('#submit-areal').html('<span class="fa fa-spinner fa-spin"></span> Ukladám');
    var url = '/areals';
    var id = $('#areal-id').val();
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
        window.location.assign('/areals/' + res.id);
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
        $('#submit-areal').html('Uložiť');
        isLoading = false;
    });
}

/**
 * Zrusenie
 */
function onCancelClick() {
    location.href = '/areals/';
}

// odstranenie clena kapely

function onArealDeleteClik() {
    if (!$('#confirm-delete-areal').is(':visible')) {
        $('#submit-areal').prop('disabled', true);
        $('#confirm-delete-areal').show();
        return;
    }
    if (isLoading) {
        return;
    }
    isLoading = true;
    $('#error').html('');
    $('#delete-areal').html('<span class="fa fa-spinner fa-spin""></span> Odstraňujem');
    var id = $('#areal-id').val();
    var url = '/areals/' + id;
    $.ajax({
        method: 'DELETE',
        url: url,
        dataType: 'json'
    }).done(function () {
        location.href = '/areals/';
    }).fail(function (res) {
        var message = '';
        if (res && res.responseJSON && Array.isArray(res.responseJSON.errors)) {
            if (res.responseJSON.errors.length > 0) {
                res.responseJSON.errors.forEach(function (e) {
                    message += e.error + '<br/>';
                });
            }
        }
        showErrorMessage(message || ' Nepodarilo sa odstrániť kapelu');
    }).always(function () {
        $('#delete-areal').html('Odstrániť');
        isLoading = false;
    });
}

/**
 * nastavenie obsahu stranky podla prepinaca medzi budovou a uzemim
 */
function setContent() {
    var building = $('input[name=switch]:checked', '.switch-field').val();
    if (building === "Yes") {
        $('#floors').show();
        $('#territoryMap').hide();
    } else {
        $('#floors').hide();
        $('#territoryMap').show();

        // Nastavenie obrazku
        var url = $('#map-image').val();
        if (url) {
            setUploadedImageThumbnail('#map-image', url);
        }
    }
}

/**
 * Skrytie modalneho okna pre vrchol- restart hodnot.  
 */
function onHideModalNode() {
    // Schovam chybove hlasenia
    $('#node-error').html('');
    $('#node-name').closest('.form-group').removeClass('has-error');
    $('#type-combobox').closest('.form-group').removeClass('has-error');
    $('#node-yPosition').closest('.form-group').removeClass('has-error');
    $('#node-xPosition').closest('.form-group').removeClass('has-error');

    // Zakladne
    $('#confirm-delete-node').hide();
    $('#delete-node').hide();
    $('#submit-node').prop('disabled', false);
    $('#node-id').val('');
    $('.modal-node-title').html('Nový&nbsp;vrchol');

    // X-ova suradnica
    $('#node-xPosition').val('');

    // Y-ova suradnica
    $('#node-yPosition').val('');

    // Nazov vrcholu
    $('#node-name').val('');

    // Typ vrcholu
    $("#type-combobox").val("Placeholder").change();
}

/**
 * Nastavenie oblasti grafickeho zobrazenia bodu na mape pre novy vrchol.  
 */
function onNewNodeClick() {
    var poschodia = $('input[name=switch]:checked', '.switch-field').val() === "Yes"
        ? $('#table-floors tbody tr').map(function () {
            return $(this).data().item
        }).get()
        : null;
    var url = $('input[name=switch]:checked', '.switch-field').val() === "Yes" ? null : $('#map-image').val();
    showMapsOfFloors(poschodia, url, 1, true);
    setMapPinPosition();
}

/**
 * Nastavenie hodnot pre existujuci vrchol.  
 */
function onTableNodeClick() {

    var node = $(this).data().item;
    console.log(node);
    var index = $(this).index();
    // Zakladne
    $('#delete-node').show();
    $('.modal-node-title').html(node.nazov || 'Detail&nbsp;vrcholu');
    $('#node-id').val(index);

    // Nazov vrcholu
    $('#node-name').val(node.nazov || '');

    // Typ vrcholu 
    $("#type-combobox").val(node.typ || "Placeholder").change();

    // Nastavenie pozicie bodu
    $('#node-xPosition').val(node.suradnicaX);
    $('#node-yPosition').val(node.suradnicaY);

    // Oblast pre graficke pridanie vrcholu
    var poschodia = $('input[name=switch]:checked', '.switch-field').val() === "Yes"
        ? $('#table-floors tbody tr').map(function () {
            return $(this).data().item
        }).get()
        : null;
    //console.log(poschodia);
    var url = $('input[name=switch]:checked', '.switch-field').val() === "Yes" ? null : $('#map-image').val();
    showMapsOfFloors(poschodia, url, node.poschodie, false);

    $('#node-modal').on('show.bs.modal', setMapPinPosition(node.suradnicaX, node.suradnicaY));


}

/**
 * Vytvorenie noveho vrcholu alebo aktualizacia existujuceho
 */
function onSubmitNodeClick() {
    $('#node-name').closest('.form-group').removeClass('has-error');
    $('#type-combobox').closest('.form-group').removeClass('has-error');
    $('#node-xPosition').closest('.form-group').removeClass('has-error');
    $('#node-yPosition').closest('.form-group').removeClass('has-error');
    $('#node-error').html('');
    var index = $('#node-id').val();
    if (index) {
        updateNode(index);
    } else {
        addNode();
    }

}

/**
 * Pridanie noveho vrcholu
 */
function addNode() {
    var budova = $('input[name=switch]:checked', '.switch-field').val() === "Yes" ? true : false;
    var node = {
        nazov: $('#node-name').val(),
        typ: $("#type-combobox").val(),
        suradnicaX: $("#node-xPosition").val(),
        suradnicaY: $("#node-yPosition").val(),
        poschodie: $("#buttons .btn-normal-active").html()
    };
    var name = node.nazov.trim();
    if (name && node.typ && node.suradnicaX && node.suradnicaY) {

        if (checkItemExistInTable('#table-nodes', node)) {
            $('#node-name').closest('.form-group').addClass('has-error');
            showErrorMessage('Zadaný vrchol už existuje.');
            return;
        }

        if(budova && !node.poschodie){
            showErrorMessage('Vyberte poschodie');
            return;
        }

        var countRows = $("#table-nodes tbody tr").length;
        if (countRows === 0) {
            $('#table-nodes').show();
            $('#nodes-empty').hide();
        }

        node.suradnicaX = isInt(node.suradnicaX);
        node.suradnicaY = isInt(node.suradnicaY);
        node.nazov = name;
        var html = '<tr class="node-detail"  data-toggle="modal" data-target="#node-modal">' +
            '<td class="text-center">' + node.nazov + '</td>' +
            '<td class="text-center">' + node.typ + '</td>' +
            '</tr>';
        var row = $(html);
        row.data('item', node);
        $('#table-nodes tbody').append(row);
        $('#node-modal').modal('toggle');
    } else {
        var html = '<div class="alert alert-danger" role="alert">';
        if (!node.typ) {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Zadajte typ vrcholu.<br />';
            $('#type-combobox').closest('.form-group').addClass('has-error');
        }
        if (name == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Zadajte názov vrcholu.<br />';
            $('#node-name').closest('.form-group').addClass('has-error');
        }
        if (node.suradnicaX == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Vyberte X-ovu súradnicu.<br />';
            $('#node-xPosition').closest('.form-group').addClass('has-error');
        }
        if (node.suradnicaY == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Vyberte Y-ovu súradnicu.<br />';
            $('#node-yPosition').closest('.form-group').addClass('has-error');
        }

        html += '</div>';
        $('#node-error').html(html);
    }

    //scroll and of table
    var countRows = $("#table-nodes tbody tr").length + 1;
    var heightRow = $("#table-nodes tbody tr").height();
    $("#table-nodes tbody").scrollTop(countRows * heightRow);
}


/**
 * Aktualizacia vrcholu 
 */
function updateNode(index) {
    var budova = $('input[name=switch]:checked', '.switch-field').val() === "Yes" ? true : false;
    var node = {
        nazov: $('#node-name').val(),
        typ: $("#type-combobox").val(),
        suradnicaX: $("#node-xPosition").val(),
        suradnicaY: $("#node-yPosition").val(),
        poschodie: $("#buttons .btn-normal-active").html()
    };
    var name = node.nazov.trim();
    if (name && node.typ && node.suradnicaX && node.suradnicaY ) {
        if (checkUpdateItemInTable('#table-nodes', node, index)) {
            $('#node-name').closest('.form-group').addClass('has-error');
            showErrorMessage('Zadaný vrchol už existuje.');
            return;
        }
        if(budova && !node.poschodie){
            showErrorMessage('Vyberte poschodie');
            return;
        }
        node.suradnicaX = isInt(node.suradnicaX);
        node.suradnicaY = isInt(node.suradnicaY);
        node.nazov = name;
        var html = '<td class="text-center">' + node.nazov + '</td>' +
            '<td class="text-center">' + node.typ + '</td>';
        var row = $('#table-nodes tbody tr').eq(index).html(html);
        row.data('item', node);
        $('#node-modal').modal('toggle');
    } else {
        var html = '<div class="alert alert-danger" role="alert">';
        if (!node.typ) {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Zadajte typ vrcholu.<br />';
            $('#type-combobox').closest('.form-group').addClass('has-error');
        }
        if (name == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Zadajte názov vrcholu.<br />';
            $('#node-name').closest('.form-group').addClass('has-error');
        }
        if (node.suradnicaX == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Vyberte X-ovu súradnicu.<br />';
            $('#node-xPosition').closest('.form-group').addClass('has-error');
        }
        if (node.suradnicaY == '') {
            html += '<span class="fa fa-exclamation-triangle"" aria-hidden="true"></span>';
            html += '<span class="sr-only">Chyba:</span>Vyberte Y-ovu súradnicu.<br />';
            $('#node-yPosition').closest('.form-group').addClass('has-error');
        }
        html += '</div>';
        $('#node-error').html(html);
    }
}

/**
 *  Odstranenie vrcholu 
 */
function onDeleteNodeClik() {
    if (!$('#confirm-delete-node').is(':visible')) {
        $('#submit-node').prop('disabled', true);
        $('#confirm-delete-node').show();
        return;
    }

    var index = $('#node-id').val();
    var row = $('#table-nodes tbody tr').eq(index).remove();

    var countRows = $("#table-nodes tbody tr").length;
    if (countRows === 0) {
        $('#table-nodes').hide();
        $('#nodes-empty').show();
    }
    $('#node-modal').modal('toggle');
}


/**
 * Nastavenie mapy pre poschodie podla  param poschodia
 * @param {object} poschodia parameter obsahujuci poschodia arealu.
 */
function showMapsOfFloors(poschodia, url, floor, byIndex) {

    // pridanie tlacidiel pre poschodia
    $('#node-maps').addClass("imgScroll");
    $('#node-maps').removeClass("info-message");
    $('#node-maps').removeClass("text-center");
    $('#buttons').empty();
    $('.imgScroll').empty();
    if (poschodia && Array.isArray(poschodia) && poschodia.length > 0) {
        var mapPin = $('<i id="mapPin" class="fa fa-map-marker faa-pulse animated fa-3x "></i>');
        $('.imgScroll').append(mapPin);
        var i = 1;

        poschodia.forEach(function (element) {
            var html = '<button id="' + (byIndex ? i : element.cislo) + '" class="btn btn-normal margin" data-item=' + i + '>' + element.cislo + ' </button>';
            var row = $(html);
            row.data('item', i);
            $('#buttons').append(row);
            i++;
        });

        // pridanie obrazkov map pre poschodia 
        poschodia.forEach(function (element) {
            var html = '<img class="mySlides" src="' + element.url + '">';
            var row = $(html);
            $('.imgScroll').append(row);
        });
    } else if (url) {
        var mapPin = $('<i id="mapPin" class="fa fa-map-marker faa-pulse animated fa-3x "></i>');
        $('.imgScroll').append(mapPin);
        var html = '<img class="mySlides" src="' + url + '">';
        var row = $(html);
        $('.imgScroll').append(row);
        byIndex = true;
        floor = 1;
    } else {
        var message = $('<span>Muíte pridať mapu pre areál</span>');
        $('#node-maps').removeClass("imgScroll");
        $('#node-maps').addClass("info-message text-center");
        $('#node-maps').append(message);
        return
    }
    // nastavenie prveho obrazku 
    showMap(floor, byIndex);
}


/**
 *  Nastavenie obrayku podla stlaceneho tlacidla
 */
function currentMap() {
    // vymazem poziciu pinu
    $('#node-xPosition').val('');
    $('#node-yPosition').val('');

    var position = $(this).data().item;
    showMap(position, true);
}

/**
 *  Zobrazi obrazok
 */
function showMap(n, byIndex) {
    var x = $(".mySlides");
    for (var i = 0; i < x.length; i++) {
        $(x[i]).removeClass("active");
        x[i].style.display = "none";
    }

    var button = $("#buttons .btn-normal-active");
    button.removeClass('btn-normal-active');
    if (!byIndex) {
        $('#' + n).addClass('btn-normal-active');
        n = $('#' + n).data().item;
    } else {
        var buttons = $("#buttons").children();
        $(buttons[n - 1]).addClass('btn-normal-active');
    }
    $(x[n - 1]).addClass("active");
    x[n - 1].style.display = "block";
}

function setMapPinPosition(x, y) {
    var mapPinHeigth = 42;

    if (!x || !y) {
        x = 0;
        y = 0;
    }

    // musim pockat, az potom mozem skrolovat a nastavit bod  
    setTimeout(function () {
        var bottomSliderHeight = 17;
        var heightMapWindows = $(".imgScroll").height() - bottomSliderHeight;
        var rightSliderWidth = 10;
        var widthtMapWindows = $(".imgScroll").width() - rightSliderWidth;

        $(".imgScroll").scrollTop(y - heightMapWindows / 2);
        $(".imgScroll").scrollLeft(x - widthtMapWindows / 2);

        // posunutie a zobrazenie bodu na spravnom mieste
        $("#mapPin").css({ left: (x) + "px", top: (y + mapPinHeigth / 3) + "px" });
    }, 220);

    // nastavenie suradnice X a suradnice Y podla umiestnenia pinu
    $('#mapPin').draggable(
        {
            drag: function () {
                var offset = $(this).offset();
                var yOffsetMapWindow = $(".mySlides.active").offset().top;
                var xOffsetMapWindow = $(".mySlides.active").offset().left;
                var xPos = Math.round(offset.left - xOffsetMapWindow);
                var yPos = Math.round(offset.top - yOffsetMapWindow);
                $('#node-xPosition').val(xPos);
                $('#node-yPosition').val(yPos);
            }
        });
}

/**
 * Skrytie modalneho okna pre poschodie- restart hodnot.  
 */
function onHideModalFloor() {
    // Schovam chybove hlasenia
    $('#floor-number').closest('.form-group').removeClass('has-error');
    $('#upload-image-error').html('');
    $('#upload-image-error').hide();

    // Zakladne
    $('#confirm-delete-floor').hide();
    $('#delete-floor').hide();
    $('#submit-floor').prop('disabled', false);
    $('#floor-id').val('');
    $('.modal-floor-title').html('Nové&nbsp;poschodie');

    // Nazov vrcholu
    $('#floor-number').val('');

    // Upload obrazkov 
    $('.floor-image').val('');
    $('.upload-image-wrapper').removeClass('with-bg');
    $('.upload-image-wrapper').css('background-image', '');
    $('.btn-upload-image').html('Nahrať obrázok');

    var input = $('#floor-image-file');
    input.replaceWith(input = input.clone(true));
}

/**
 * Nastavenie hodnot pre existujuce poschodie.  
 */
function onTableFloorClick() {
    var floor = $(this).data().item;
    var index = $(this).index();

    // Zakladne
    $('#delete-floor').show();
    $('.modal-floor-title').html(floor.cislo !== null ? 'Poschodie: ' + floor.cislo : 'Detail&nbsp;poschodia');
    $('#floor-id').val(index);

    // Nazov vrcholu
    $('#floor-number').val(floor.cislo !== null ? floor.cislo : '');

    // Nastavenie obrazku
    if (floor.url) {
        setUploadedImageThumbnail('#floor-image', floor.url);
    }
}

/**
 * Vytvorenie noveho poschodia alebo aktualizacia existujuceho
 */
function onSubmitFloorClick() {
    $('#floor-number').closest('.form-group').removeClass('has-error');
    var index = $('#floor-id').val();
    if (index) {
        updateFloor(index);
    } else {
        addFloor();
    }
}

/**
 * Pridanie noveho poschodia
 */
function addFloor() {
    var floor = {
        url: $('#floor-image').val(),
        cislo: $("#floor-number").val()
    };
    var url = floor.url.trim();
    var cislo = isInt(floor.cislo);
    if (url && cislo !== false) {
        floor.cislo = cislo;
        if (checkItemExistInTable('#table-floors', floor)) {
            showErrorMessage('Zadané poschodie už existuje.');
            return;
        }

        var countRows = $("#table-floors tbody tr").length;
        if (countRows === 0) {
            $('#table-floors').show();
            $('#floors-empty').hide();
        }

        var html = '<tr class="floor-detail"  data-toggle="modal" data-target="#floor-modal">' +
            '<td class="text-center hide-on-mobile"><a href="' + floor.url + '"><img src="' + floor.url + '"class="thumb"></a></td>' +
            '<td class="text-center">' + floor.cislo + '</td>' +
            '</tr>';
        var row = $(html);
        row.data('item', floor);
        $('#table-floors tbody').append(row);
        $('#floor-modal').modal('toggle');
    } else if (cislo === false && url == '') {
        showErrorMessage('Vyberte obrázok a zadajjte číslo poschodia.');
        $('#floor-number').closest('.form-group').addClass('has-error');
    } else if (url == '') {
        showErrorMessage('Vyberte obrázok.');
    } else {
        showErrorMessage('Zadajte číslo.');
        $('#floor-number').closest('.form-group').addClass('has-error');
    }
}

/**
 * Aktualizacia poschodia 
 */
function updateFloor(index) {
    var floor = {
        url: $('#floor-image').val(),
        cislo: $("#floor-number").val()
    };
    var url = floor.url.trim();
    var cislo = isInt(floor.cislo);
    if (url && cislo !== false) {
        floor.cislo = cislo;
        if (checkUpdateItemInTable('#table-floors', floor, index)) {
            showErrorMessage('Zadané poschodie už existuje.');
            return;
        }
        var html = '<td class="text-center hide-on-mobile"><a href="' + floor.url + '"><img src="' + floor.url + '"class="thumb"></a></td>' +
            '<td class="text-center">' + floor.cislo + '</td>';
        var row = $('#table-floors tbody tr').eq(index).html(html);
        row.data('item', floor);
        $('#floor-modal').modal('toggle');
    } else if (cislo === false && url == '') {
        showErrorMessage('Vyberte obrázok a zadajjte číslo poschodia.');
        $('#floor-number').closest('.form-group').addClass('has-error');
    } else if (url == '') {
        showErrorMessage('Vyberte obrázok.');
    } else {
        showErrorMessage('Zadajte číslo.');
        $('#floor-number').closest('.form-group').addClass('has-error');
    }
}

/**
 *  Odstranenie poschodia z tabulky 
 */
function onDeleteFloorClik() {
    if (!$('#confirm-delete-floor').is(':visible')) {
        $('#submit-floor').prop('disabled', true);
        $('#confirm-delete-floor').show();
        return;
    }
    var index = $('#floor-id').val();
    var row = $('#table-floors tbody tr').eq(index).remove();

    var countRows = $("#table-floors tbody tr").length;
    if (countRows === 0) {
        $('#table-floors').hide();
        $('#floors-empty').show();
    }
    $('#floor-modal').modal('toggle');
}

/**
 *  Kotrloje či sa vkladana položka už nacháza v tabulke
 */
function checkItemExistInTable(tableId, item) {
    var items = $(tableId + ' tbody tr').map(function () {
        return $(this).data().item;
    }).get();
    switch (tableId) {
        case '#table-nodes':
            return items.findIndex(e => e.nazov === item.nazov) >= 0;
        case '#table-floors':
            return items.findIndex(e => e.cislo === item.cislo) >= 0;
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
            case '#table-nodes':
                return items.findIndex(e => e.nazov === item.nazov) >= 0;
            case '#table-floors':
                return items.findIndex(e => e.cislo === item.cislo) >= 0;
            default:
                return false;
        }
    }
    return false;
}

/**
 * Inicializacia uploadu obrazkov na AWS S3.
 */
function initializeImageUpload() {
    $('.btn-upload-image').click(function () {
        var button = $(this);
        var fileInput = button.next('.file-input');
        var uploadedInput = fileInput.next('.uploaded-image-input');
        var wrapper = button.closest('.upload-image-wrapper');
        if (uploadedInput.val()) {
            uploadedInput.val('');
            wrapper.removeClass('with-bg');
            wrapper.css('background-image', '');
            button.html('Nahrať obrázok');
        }
        fileInput.click();
    });

    // Vyber obrazku cez dialogove okno
    $('.file-input').change(function () {
        var fileInput = $(this);
        var fileInputId = fileInput.attr('id');
        var fileInputPicker = document.getElementById(fileInputId);
        var uploadedInput = fileInput.next('.uploaded-image-input');
        var button = fileInput.prev('.btn-upload-image');
        var formData = null;
        if (fileInputPicker.files.length > 0) {
            var file = fileInputPicker.files[0];

            // pridanie suboru do  formData objektu
            formData = new FormData();
            formData.append('upload', file, file.name);
        }
        if (formData) {
            var message = '';
            var wrapper = fileInput.closest('.upload-image-wrapper');
            if (formData.get('upload').type === 'image/jpeg' || formData.get('upload').type === 'image/png') {
                button.html('<span class="fa fa-refresh fa-spin"></span> Nahrávam');
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/upload', true);
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.onload = function () {
                    switch (xhr.status) {
                        case 200:
                            res = JSON.parse(xhr.responseText);
                            uploadedInput.attr('value', res.url);
                            showSelectedImageThumbnail(file, wrapper);
                            button.html('Zmeniť obrázok');
                            break;
                        case 431:
                            message = 'Veľkosť obrázku max 4MB';
                            onImageUploadError(wrapper, button, message);
                            break;
                        case 403:
                            message = 'Server neoodpovedá. Skúste to neskôr prosím.';
                            onImageUploadError(wrapper, button, message);
                            break;
                        default:
                            onImageUploadError(wrapper, button, message);

                    }
                };
                xhr.onerror = function (err) {
                    onImageUploadError(wrapper, button, '');
                };
                xhr.send(formData);
            } else {
                message = 'Vyberte obrázok s príponou jpg/png prosím.';
                onImageUploadError(wrapper, button, message);
            }
        }
    });

	/**
	 * Zobrazenie chyby v pripade neuspesneho ulozenia obrazku
	 */
    function onImageUploadError(wrapper, button, message) {
        var errMessage = ' Nepodarilo sa uložiť obrázok. ' + message;
        showErrorMessage(errMessage);
        wrapper.removeClass('with-bg');
        wrapper.css('background-image', '');
        button.html('Nahrať obrázok');
    }

	/**
	 * Zobrazenie nahladu nahrateho obrazku
	 */
    function showSelectedImageThumbnail(file, wrapper) {
        var reader = new FileReader();
        reader.onload = function (e) {
            wrapper.addClass('with-bg');
            wrapper.css('background-image', 'url(' + e.target.result + ')');
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Nastavenie uploadnuteho obrazku do nahladu v modalnom okne.
 */
function setUploadedImageThumbnail(selector, url) {
    $(selector).val(url);
    var wrapper = $(selector).closest('.upload-image-wrapper');
    wrapper.addClass('with-bg');
    wrapper.css('background-image', 'url(' + url + ')');
    $(selector).siblings('.btn-upload-image').html('Zmeniť obrázok');
}

/**
 * Overenie či je vstup čislo.
 */
function isInt(value) {
    value = value.trim();
    if (!isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10))) {
        return parseInt(value);
    } else {
        return false;
    }
}

/**
 * Nastavenie chyby pri polozke vo formulari.
 */
function onAttributeError(e) {
    switch (e.name) {
        case 'alreadyExists':
        case 'nazov':
            $('#areal-name').closest('.form-group').addClass('has-error');
            break;
    }
}

/**
 * Zostavenie dat pre request - vytvorenie / aktualizacia zaznamu.
 */

function composeRequestData() {
    var data = {
        nazov: $('#areal-name').val(),
        budova: $('input[name=switch]:checked', '.switch-field').val() === "Yes" ? true : false,
        url: $('input[name=switch]:checked', '.switch-field').val() === "Yes" ? null : $('#map-image').val(),
        poschodia: $('input[name=switch]:checked', '.switch-field').val() === "Yes"
            ? $('#table-floors tbody tr').map(function () {
                return $(this).data().item
            }).get()
            : null,
        vrcholy: $('#table-nodes tbody tr').map(function () {
            return $(this).data().item
        }).get()
    };
    return data;
}