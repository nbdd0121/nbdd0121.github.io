(function($) {
	function codeEditorHandler() {
		return this.codeEditor;
	}
	$.fn.codeEditor = function() {
		if (this.length != 1) {
			throw new Error('codeEditor can only be called on exactly one element');
		}
		if (this[0].codeEditor) {
			return this[0].codeEditor();
		}
		this.attr('contenteditable', true);
		this[0].codeEditor = codeEditorHandler.bind(this[0]);
	}

	$(function() {
		$(".x-codeeditor").each(function(i, a) {
			$(a).codeEditor();
		});
	});
})(jQuery);