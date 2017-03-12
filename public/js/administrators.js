
var isLoading = false;

$(document).ready(function () {
	   
    $('#submit-item').bind('click', onSubmitItemClick);

	// Skrytie modalneho okna - restart hodnot
	$('#item-modal').on('hidden.bs.modal', onHideModal);

	// Zobrazenie detailu existujuceho pouzivatela
	$('.item-detail').on('click', onTableItemClick);

    // Odstranenie existujuceho pouzivatela
	$('#delete-item').on('click', onDeleteItemClick);
	
	// Uprava datumov v tabulke do lokalneho formatu podla nastaveni pouzivatela
	$('.local-datetime').each(function() {
		if(!new Date($(this).html()).getTime()){
		var timestamp = parseInt($(this).html());		
		if (isNaN(timestamp) || timestamp <= 0) {
			$(this).html('-');
			return;
		}
		var datetime = new Date(timestamp);
		if (!datetime || isNaN(datetime.getTime())) {
			$(this).html('-');
			return;
		}
		} else {
			var datetime = new Date($(this).html());
		if (!datetime || isNaN(datetime.getTime())) {
			$(this).html('-');
			return;
		}
		}
		$(this).html(moment(datetime).format('D. M. YYYY o HH:mm:ss').replace(/\s/g, '&nbsp;'));
	});
});


// Zobrazenie existujuceho pouzivatela


function onTableItemClick() {
    var user = $(this).data().item;
        
	// Zakladne
	$('#item-id').val(user.administrator._id || '');
	$('#delete-item').show();
	$('#item-modal .info-message').hide();
	$('.modal-title').html(user.administrator.name || 'Detail&nbsp;používateľa');

	// Email pouzivatela
	$('#user-email').val(user.administrator.email || '');
	$('#user-email').prop('disabled', true);

	// Meno pouzivatela
	$('#user-name').val(user.administrator.name || '');

	// Aktivacia
	$('#user-activated').prop('checked', user.administrator.isActive);
    
    // Aktivaci radio button podla permissons
    $('#ADMIN').prop('checked', user.administrator.permissions === 'ADMIN');
    $('#SUPERADMIN').prop('checked', user.administrator.permissions === 'SUPERADMIN');
}

/**
 * Skrytie modalneho okna - restart hodnot. 
 */
    function onHideModal() {
  
	// Schovam chybove hlasenia
	$('#user-email').closest('.form-group').removeClass('has-error');
	$('#user-name').closest('.form-group').removeClass('has-error');

	// Zakladne
	$('#item-id').val('');
	$('#confirm-delete-item').hide();
	$('#delete-item').hide();
	$('#submit-item').prop('disabled', false);
	$('#error').html('');
	$('#item-modal .well').show();
	$('.modal-title').html('Nový&nbsp;používateľ');

	// Prihlasovacie meno pouzivatela
	$('#user-email').val('');
	$('#user-email').prop('disabled', false);

	// Meno pouzivatela
	$('#user-name').val('');

	// Aktivacia
	$('#user-activated').prop('checked', true);
    
    // nastavenia radion button pre admina
    $('#ADMIN').prop('checked', true);
	
}



function onDeleteItemClick() {
	if (!$('#confirm-delete-item').is(':visible')) {
		$('#submit-item').prop('disabled', true);
		$('#confirm-delete-item').show();
		return;
	}
	if (isLoading) {
		return;
	}
	isLoading = true;

	$('#error').html('');
	$('#delete-item').html('<span class="fa fa-spinner fa-spin"></span> Odstraňujem');

	var id = $('#item-id').val();
	var url = '/administrators/' + id;
	$.ajax({
		method: 'DELETE',
		url: url,
		dataType: 'json'
	}).done(function () {
		$('#item-modal').modal('hide');
		window.location.reload();
	}).fail(function (res) {
        var message = '';
		if (res && res.responseJSON && Array.isArray(res.responseJSON.errors)) {
			if (res.responseJSON.errors.length > 0) {
				res.responseJSON.errors.forEach(function (e) {
					message += e.error + '<br/>';
				});
			}
		}
		showErrorMessage(message || 'Nepodarilo sa odstrániť uživateľa');
	}).always(function () {
		$('#delete-item').html('Odstrániť');
		isLoading = false;
	});
}

/**
 * Vytvorenie noveho pouzivatela alebo aktualizacia existujuceho.
 */
function onSubmitItemClick() {
	if (isLoading) {
		return;
	}
	isLoading = true;
    $('#user-email').closest('.form-group').removeClass('has-error');
	$('#user-name').closest('.form-group').removeClass('has-error');
	$('#error').html('');
	$('#submit-item').html('<span class="fa fa-spinner fa-spin"></span> Ukladám');
	var url = '/administrators';
	var id = $('#item-id').val();
	if (id) {
		url += ('/' + id);
	}
	var data = composeRequestData(id);
	var method = id ? 'PUT' : 'POST';
	$.ajax({
		method: method,
		url: url,
		data: JSON.stringify(data),
		contentType: 'application/json',
		dataType: 'json'
	}).done(function (res) {
		$('#item-modal').modal('hide');
		window.location.reload();
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
        showErrorMessage(message || 'Nepodarilo sa uložiť uživateľa');
	}).always(function () {
		$('#submit-item').html('Uložiť');
		isLoading = false;
	});
}

/**
 * Zostavenie dat pre request - vytvorenie / aktualizacia zaznamu.
 */
function composeRequestData(id) {
	var data = {
		name: $('#user-name').val(),
		isActive: $('#user-activated').prop('checked'),
        permissions: $("input:radio[name=permissions]:checked").val()
	};
	if (!id) {
		data.email = $('#user-email').val();
	}
	return data;
}



/**
 * Nastavenie chyby pri polozke vo formulari.
 */
function onAttributeError(e) {
	switch (e.name) {
		case 'email':
			$('#user-email').closest('.form-group').addClass('has-error');
			break;
		case 'name':
			$('#user-name').closest('.form-group').addClass('has-error');
			break;
	}
}