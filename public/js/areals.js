$(document).ready(function () {

	// Zobrazenie detailu existujuceho arealu
	$('.item-detail').on('click', onTableItemClick);
});


/**
 * Zobrazenie detailu existujuceho arealu.
 */
function onTableItemClick() {
	location.href = '/areals/' + $(this).data().item;
}