$(document).ready(function () {

    initializeImageUpload();

    // nastavenie obsahu po nacitani stranky
    setContent();

    // nastavenie obsahu po cliknuti na prepinac
    $('input[name=switch]', '.switch-field').on('click', setContent);

    // vyhladavanie v tabulke vrcholov
    $('#node-search-name').keyup(search('#node-search-name', '#table-nodes'));

    // Skrytie modalneho okna pre detail vrcholu  - restart hodnot
    $('#node-modal').on('hidden.bs.modal', onHideModalNode);

    // Zobrazenie detailu existujuceho vrcholu
    $('#table-nodes tbody').on('click', '.node-detail', onTableNodeClick);

    //Vytvorenie noveho vrcholu alebo aktualizacia existujuceho
    $('#submit-node').bind('click', onSubmitNodeClick);

    // Odstranenie  vrcholu z tabulky
    $('#delete-node').bind('click', onDeleteNodeClik);

});

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

    }
}

/**
 * Skrytie modalneho okna pre vrchol- restart hodnot.  
 */
function onHideModalNode() {
    // Schovam chybove hlasenia
    $('#node-name').closest('.form-group').removeClass('has-error');
    $('#type-combobox').closest('.form-group').removeClass('has-error');

    // Zakladne
    $('#confirm-delete-node').hide();
    $('#delete-node').hide();
    $('#submit-node').prop('disabled', false);
    $('#node-id').val('');
    $('.modal-node-title').html('Nový&nbsp;používateľ');

    // Nazov vrcholu
    $('#node-name').val('');

    // Typ vrcholu
    $("#type-combobox").val("Placeholder").change();
}

/**
 * Nastavenie hodnot pre existujuci vrchol.  
 */
function onTableNodeClick() {
    var node = $(this).data().item;
    var index = $(this).index();
    // Zakladne
    $('#delete-node').show();
    $('.modal-node-title').html(node.nazov || 'Detail&nbsp;vrcholu');
    $('#node-id').val(index);

    // Nazov vrcholu
    $('#node-name').val(node.nazov || '');

    // Typ vrcholu 
    $("#type-combobox").val(node.typ || "Placeholder").change();
}

/**
 * Vytvorenie noveho vrcholu alebo aktualizacia existujuceho
 */
function onSubmitNodeClick() {
    $('#node-name').closest('.form-group').removeClass('has-error');
    $('#type-combobox').closest('.form-group').removeClass('has-error');
    var index = $('#node-id').val();
    console.log(index);
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
    var node = {
        nazov: $('#node-name').val(),
        typ: $("#type-combobox").val()
    };
    var name = node.nazov.trim();
    var typ = node.typ;
    if (name && typ) {
        if (checkItemExistInTable('#table-nodes', node)) {
            showErrorMessage('Zadaný vrchol už existuje.');
            return;
        }
        var html = '<tr class="node-detail"  data-toggle="modal" data-target="#node-modal">' +
            '<td class="text-center">' + node.nazov + '</td>' +
            '<td class="text-center">' + node.typ + '</td>' +
            '</tr>';
        var row = $(html);
        row.data('item', node);
        $('#table-nodes tbody').append(row);
        $('#node-modal').modal('toggle');
    } else if (name == '' && !typ) {
        showErrorMessage('Zadajte názov a typ vrcholu.');
        $('#node-name').closest('.form-group').addClass('has-error');
        $('#type-combobox').closest('.form-group').addClass('has-error');
    } else if (name == '') {
        showErrorMessage('Zadajte názov vrcholu');
        $('#node-name').closest('.form-group').addClass('has-error');
    } else {
        showErrorMessage('Vyberte typ vrcholu.');
        $('#type-combobox').closest('.form-group').addClass('has-error');
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
    var node = {
        nazov: $('#node-name').val(),
        typ: $("#type-combobox").val()
    };
    var name = node.nazov.trim();
    var typ = node.typ;
    if (name && typ) {
        if (checkUpdateItemInTable('#table-nodes', node, index)) {
            showErrorMessage('Zadaný vrchol už existuje.');
            return;
        }
        var html = '<td class="text-center">' + node.nazov + '</td>' +
            '<td class="text-center">' + node.typ + '</td>';
        var row = $('#table-nodes tbody tr').eq(index).html(html);
        row.data('item', node);
        $('#node-modal').modal('toggle');
    } else if (name == '' && !typ) {
        showErrorMessage('Zadajte názov a typ vrcholu.');
        $('#node-name').closest('.form-group').addClass('has-error');
        $('#type-combobox').closest('.form-group').addClass('has-error');
    } else if (name == '') {
        showErrorMessage('Zadajte názov vrcholu');
        $('#node-name').closest('.form-group').addClass('has-error');
    } else {
        showErrorMessage('Vyberte typ vrcholu.');
        $('#type-combobox').closest('.form-group').addClass('has-error');
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
    $('#node-modal').modal('toggle');
}

/**
 *  Kotrloje či sa vkladana položka už nacháza v tabulke
 */
function checkItemExistInTable(tableId, item) {
    var items = $(tableId + ' tbody tr').map(function () {
        return $(this).data().item;
    }).get();
    if (items.length > 0 && items.findIndex(e => e.nazov === item.nazov && e.typ === item.typ) >= 0) {
        return true;
    }
    return false;
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
        if (items.findIndex(e => e.nazov === item.nazov && e.typ === item.typ) >= 0) {
            return true;
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
        var uploadedInput = button.next('.uploaded-image-input');
        var wrapper = button.closest('.upload-image-wrapper');
        if (uploadedInput.attr('value')) {
            uploadedInput.attr('value', '');
            wrapper.removeClass('with-bg');
            wrapper.css('background-image', '');
            button.html('Nahrať obrázok');
        }
        fileInput.click();
        $('#upload-image-error').html('');
        $('#upload-image-error').hide();
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
        var error = '<div class="alert alert-danger" role="alert">';
        error += '<span class="fa fa-exclamation-triangle" aria-hidden="true"></span>';
        error += '<span class="sr-only">Chyba:</span>' + errMessage + '<br /></div>';
        $('#upload-image-error').html(error);
        $('#upload-image-error').show();
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