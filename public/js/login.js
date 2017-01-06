$(document).ready(function () {

    var isLoading = false;

	// Prihlasenie pouzivatela - klik na tlacidlo
	$('#submit').bind('click', function () {
		loginUser();
	});

	// Prihlasenie pouzivatela - potvrdenie prihlasenia klavesou ENTER
	$(document).keypress(function (e) {
		if (e.which == 13) {
			loginUser();
		}
	});

	/**
	 * Prihlasenie pouzivatela.
	 */
	function loginUser() {
		if (isLoading) {
			return;
		}
		isLoading = true;
        $('#email').closest('.form-group').removeClass('has-error');
        $('#password').closest('.form-group').removeClass('has-error');
        $('#submit').html('<i class="fa fa-spinner fa-spin"></i> Prihlasujem');
		var data = composeRequestData();
		$.ajax({
			method: 'POST',
			url: '/login',
			data: JSON.stringify(data),
			contentType: 'application/json',
			dataType: 'json'
		}).done(function () {
			window.location.replace('/');
		}).fail(function (res) {
            var message = '';
            if (res && res.responseJSON && Array.isArray(res.responseJSON.errors)) {
                res.responseJSON.errors.forEach(function (e) {
                    message += e.error + '<br/>';
                    onAttributeError(e);
                });
            }
            $('#password').val('');
            showErrorMessage(message || 'Nepodarilo sa prihlásiť.');
		}).always(function () {
			$('#submit').html('Prihlásiť');
			isLoading = false;
		});
	}
});

/**
 * Nastavenie chyby pri polozke vo formulari.
 */
function onAttributeError(e) {
	switch (e.name) {
		case 'email':
			$('#email').closest('.form-group').addClass('has-error');
			break;
		case 'password':
			$('#password').closest('.form-group').addClass('has-error');
			break;
	}
}

/**
 * Zostavenie dat pre request - vytvorenie / aktualizacia zaznamu.
 */
function composeRequestData() {
	return {
		email: $('#email').val(),
		password: $('#password').val(),
		remember: $('#remember').prop('checked')
	}
}
