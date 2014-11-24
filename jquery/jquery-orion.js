(function($) {
	var edit = require("orion/editor/edit");
	$.fn.orion = function(method) {
		var editors = Array(this.length);
		for (var i = 0; i < this.length; i++) {
			if (this[i].orion) {
				editors[i] = this[i].orion;
			} else {
				var orion = edit({
					parent: this[i],
					lang: "js",
					wrappable: true,
					wrapMode: true
				});
				editors[i] = this[i].orion = orion;

				orion.getContentAssist().setProviders([
					require('norlit/editor').contentAssist
				]);
			}
		}
		if (method !== undefined) {
			switch (method) {
				case 'text':
					{
						if (arguments.length == 1) {
							var ret = "";
							for (var i = 0; i < editors.length; i++) {
								ret += editors[i].getText();
							}
							return ret;
						} else {
							var txt = arguments[1];
							for (var i = 0; i < editors.length; i++) {
								editors[i].setText(txt);
							}
							return this;
						}
					}
				default:
					throw 'error';
			}
		}
	}
})(jQuery);