(function($) {
	var edit = require("orion/editor/edit");
	$.fn.orion = function(method, arg0) {
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
						if (arg0 === undefined) {
							var ret = "";
							for (var i = 0; i < editors.length; i++) {
								ret += editors[i].getText();
							}
							return ret;
						} else {
							for (var i = 0; i < editors.length; i++) {
								editors[i].setText(arg0);
							}
							return this;
						}
					}
				case 'change':
					{
						for (var i = 0; i < editors.length; i++) {
							editors[i].getTextView().addEventListener("ModelChanged", arg0);
						}
						break;
					}
				default:
					throw 'error';
			}
		} else {
			return this;
		}
	}
})(jQuery);