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