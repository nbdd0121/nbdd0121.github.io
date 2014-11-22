(function($) {
	function CodeEditor(object) {
		this.object = object;
		this.rulerlines = $('<div class="x-ce-rulerlines">');
		this.panel = $('<div class="x-ce-panel" contenteditable spellcheck=false>');

		this.panel.bind('paste', CodeEditor.prototype.onpaste.bind(this));
	}
	CodeEditor.prototype.text = function(newText) {
		if (newText === undefined) {
			var oldText = "";
			$(this.object).find(".x-ce-codeline").each(function(line, obj) {
				oldText += $(obj).text() + "\n";
			});
			return oldText;
		} else {
			$(this.object).find(".x-ce-panel").text(newText);
		}
	};
	CodeEditor.prototype.onpaste = function(event) {
		console.log(event);
	}
	$.fn.codeEditor = function(method) {
		if (this.length != 1) {
			throw new Error('codeEditor can only be called on exactly one element');
		}
		if (this[0].codeEditor) {
			return this[0].codeEditor[method].apply(this[0].codeEditor, Array.prototype.slice.call(arguments, 1));
		}
		var instance = this[0].codeEditor = new CodeEditor(this[0]);
		var rulerlines = $(instance.rulerlines);
		var panel = instance.panel;
		this.html("");
		this.append(rulerlines);
		this.append(panel);

		for (var i = 0; i < 100; i++) {
			rulerlines.append($('<div class="x-ce-rulerline">' + i + '</div>'));
			panel.append($('<div class="x-ce-codeline">Line ' + i + '</div>'));
		}
	}

	$(function() {
		$(".x-codeeditor").each(function(i, a) {
			$(a).codeEditor();
		});
	});
})(jQuery);