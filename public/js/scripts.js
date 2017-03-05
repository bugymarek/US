$(document).ready(function() {
	
	// Odhlasenie pouzivatela
	$('a.logout').bind('click', function(e) {
		e.preventDefault();
		$.ajax({
			method: 'POST',
			url: '/logout'
		}).always(function() {
			window.location.replace('/');
		});
	});
	
	// Inicializacia tooltipov pri polozkach v tabulke
	$('[data-toggle="tooltip"]').tooltip();
	
});


function showSuccessMessage(text, callback) {
    sweetAlert({
        html: text,
        type: 'success',
        confirmButtonClass: 'btn-primary',
        confirmButtonColor: '#333c47'
    }, callback || function() {});
}

function showErrorMessage(text, callback) {
    sweetAlert({
        html: text,
        type: 'error',
        confirmButtonClass: 'btn-primary',
        confirmButtonColor: '#333c47'
    }, callback || function() {});
}

function showWarningMessage(text, callback) {
    sweetAlert({
        html: text,
        type: 'warning',
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonClass: 'btn-default',
        cancelButtonColor: '#fff'
    }, callback || function() {});
}

function showDialogMessage(text, callback) {
    sweetAlert({
        html: text,
        type: 'warning',
        showCancelButton: true,
        confirmButtonClass: 'btn-primary',
        confirmButtonColor: '#333c47',
        confirmButtonText: 'Áno, odstrániť',
        cancelButtonClass: 'btn-default',
        cancelButtonColor: '#fff',
        cancelButtonText: 'Zrušiť',
        closeOnConfirm: false
    }, callback || function() {});
}

/**  
 * Vyhladavanie v tabulke
 * 
 * @param {string} searchInput identifikator input elementu.
 * @param {string} tableBody identifikator tabulky pre ktoru sa aplikuje vyhladavanie.
*/
function search(searchInput, tableBody) {
    return function () {
        var searchTerm = $(searchInput).val();
        var listItem = $('.results tbody').children('tr');
        var searchSplit = searchTerm.replace(/ /g, "'):containsi('");

        $.extend($.expr[':'], {
            'containsi': function (elem, i, match, array) {
                return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
            }
        });

        $(tableBody + " tbody tr").not(":containsi('" + searchSplit + "')").each(function (e) {
            $(this).attr('visible', 'false');
        });

        $(tableBody + " tbody tr:containsi('" + searchSplit + "')").each(function (e) {
            $(this).attr('visible', 'true');
        });
    }
}