(function($) {
	function divTextLength(obj) {
		var len = obj.text().length;
		if (obj.is('div')) {
			len++;
		}
		return len;
	}
	$.fn.textNode = function(offset) {
		var contents = this.contents();
		if (!contents.length) {
			if (this.text().length < offset) {
				console.log('Warning: Beyond the range => Use longest possible');
			}
			return {
				node: this,
				offset: Math.min(divTextLength(this), offset)
			};
		} else {
			for (var i = 0; i < contents.length; i++) {
				var n = $(contents[i]);
				var len = divTextLength(n);
				if (len > offset) {
					return n.textNode(offset);
				}
				offset -= len;
			}
			if (!this.is('div') || offset) {
				console.log('Warning: Beyond the range => Use last element');
			}
			var n = $(contents[contents.length - 1]);
			return {
				node: n,
				offset: divTextLength(n)
			};
		}
	}
	$.fn.super = function(selector) {
		if (this.is(selector)) {
			return this;
		} else {
			return this.parents(selector);
		}
	}
	$.fn.textOffset = function(node, offset) {
		if (this.length != 1) throw new Error('Expected one element only');
		if (node[0] == this[0]) {
			return offset;
		}
		var parent = node.parent();
		if (!parent.length) {
			throw new Error('Selection is not in this node');
		}
		var siblings = parent.contents();
		var totalOffset = 0;
		for (var i = 0; i < siblings.length; i++) {
			if (siblings[i] == node[0]) {
				totalOffset += offset;
				break;
			} else {
				totalOffset += divTextLength($(siblings[i]));
			}
		}
		return this.textOffset(node.parent(), totalOffset);
	}
	$.fn.selection = function(end) {
		var sel = window.getSelection();
		if (end) {
			return this.textOffset($(sel.focusNode), sel.focusOffset);
		} else {
			return this.textOffset($(sel.anchorNode), sel.anchorOffset);
		}
	}

})(jQuery);

(function($) {
	function splitLine(node, offset) {
		var text = node.text();
		var firstPart = text.substr(0, offset);
		var secondPart = text.substr(offset);
		node.text(firstPart);
		var secondLine = $('<div class="x-ce-codeline">');
		secondLine.text(secondPart);
		node.after(secondLine);
		return secondLine;
	}

	function mergeLine(line1, line2) {
		line1.text(line1.text() + line2.text());
		line2.remove();
	}

	function isCollapsed() {
		return window.getSelection().isCollapsed;
	}

	function getSelectionStart() {
		var sel = window.getSelection();
		var anchorNode = $(sel.anchorNode);
		var firstNode = anchorNode.super(".x-ce-codeline");
		return {
			node: firstNode,
			offset: firstNode.textOffset(anchorNode, sel.anchorOffset)
		};
	}

	function setRangeCollapsed(node, offset) {
		var range = document.createRange();
		var offset = node.textNode(offset);
		range.setStart(offset.node[0], offset.offset);
		range.setStart(offset.node[0], offset.offset);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}

	function CodeEditor(object) {
		this.object = object;
		this.rulerlines = $('<div class="x-ce-rulerlines">');
		this.panel = $('<div class="x-ce-panel" contenteditable spellcheck=false>');

		this.panel.bind('paste', function(event) {
			var data = event.originalEvent.clipboardData.getData('text/plain');
			if (!isCollapsed()) {
				this.removeSelected();
			}
			var offset = $(".x-ce-panel").selection();
			var text = this.text();
			this.text(text.substr(0, offset) + data + text.substr(offset));
			setRangeCollapsed($('.x-ce-panel'), offset + data.length);
			event.preventDefault();
		}.bind(this));
		this.panel.bind('keydown', function(event) {
			switch (event.which) {
				case 8:
					{
						if (!isCollapsed()) {
							this.removeSelected();
						}
						var start = getSelectionStart();
						if (start.offset == 0) {
							var prev = start.node.prev();
							if (prev.length) {
								var offset = prev.text().length;
								mergeLine(prev, start.node);
								setRangeCollapsed(prev, offset);
								this.updateRulerLines();
								console.log('Debug: Two lines are merged');
							} else {
								console.log('Debug: Backspace will not work for first line');
							}
							event.preventDefault();
						}
						break;
					}
				case 13:
					{
						if (!isCollapsed()) {
							this.removeSelected();
						}
						var start = getSelectionStart();
						setRangeCollapsed(splitLine(start.node, start.offset), 0);
						this.updateRulerLines();
						event.preventDefault();
						break;
					}
				case 46:
					{
						if (!isCollapsed()) {
							this.removeSelected();
						}
						var start = getSelectionStart();
						if (start.offset == start.node.text().length) {
							var next = start.node.next();
							if (next.length) {
								var offset = start.node.text().length;
								mergeLine(start.node, next);
								setRangeCollapsed(start.node, offset);
								this.updateRulerLines();
								console.log('Debug: Two lines are merged');
							} else {
								console.log('Debug: Delete will not work for last line');
							}
							event.preventDefault();
						}
						break;
					}
					//default:
					//	console.log("Unknown Key " + event.which);
			}
		}.bind(this));

		this.panel.bind('DOMCharacterDataModified', function(event) {
			var allLines = $(".x-ce-codeline");
			if (allLines.length != this.lastNumberOfLines) {
				this.updateRulerLines();
			} else {
				var target = $(event.target).super(".x-ce-codeline");
				var index = Array.prototype.indexOf.call(allLines, target[0]);
				this.updateRulerLine(index + 1);
			}
		}.bind(this));

		this.lastNumberOfLines = 1;
	}
	CodeEditor.prototype.removeSelected = function() {
		if (isCollapsed())
			return;
		var startOffset = this.panel.selection();
		var endOffset = this.panel.selection(true);
		if (startOffset > endOffset) {
			var swap = startOffset;
			startOffset = endOffset;
			endOffset = swap;
		}
		var text = this.text();
		this.text(text.substr(0, startOffset) + text.substr(endOffset));
		setRangeCollapsed(this.panel, startOffset);
	}
	CodeEditor.prototype.updateRulerLine = function(id) {
		$($(".x-ce-rulerline")[id - 1]).height($($(".x-ce-codeline")[id - 1]).height());
	}
	CodeEditor.prototype.updateRulerLines = function() {
		var lines = $(this.object).find(".x-ce-codeline");
		var existing = $(this.object).find(".x-ce-rulerline");
		if (existing.length > lines.length) {
			for (var i = 0; i < lines.length; i++) {
				$(existing[i]).height($(lines[i]).height());
			}
			for (var i = lines.length; i < existing.length; i++) {
				$(existing[i]).remove();
			}
		} else {
			for (var i = 0; i < existing.length; i++) {
				$(existing[i]).height($(lines[i]).height());
			}
			for (var i = existing.length; i < lines.length; i++) {
				var line = $('<div class="x-ce-rulerline">');
				this.rulerlines.append(line);
				line.text(i + 1);
				line.height($(lines[i]).height());
			}
		}
		this.lastNumberOfLines = lines.length;
	};

	CodeEditor.prototype.text = function(newText) {
		if (newText === undefined) {
			var oldText = "";
			var first = true;
			$(this.object).find(".x-ce-codeline").each(function(line, obj) {
				if (first) {
					first = false;
				} else {
					oldText += "\n";
				}
				oldText += $(obj).text();
			});
			return oldText;
		} else {
			$(this.object).find(".x-ce-rulerlines").html("");
			$(this.object).find(".x-ce-panel").html("");
			var lines = newText.replace(/\r\n/g, '\n').split(/[\r\n\u2028\u2029]/g);
			for (var i = 0; i < lines.length; i++) {
				var line = $('<div class="x-ce-rulerline">');
				var codeline = $('<div class="x-ce-codeline">');
				this.rulerlines.append(line);
				this.panel.append(codeline);
				line.text(i + 1);
				codeline.text(lines[i]);
				line.height(codeline.height());
			}
		}
	};

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
		this.codeEditor('text', '');
	}

	$(function() {
		$(".x-codeeditor").each(function(i, a) {
			$(a).codeEditor();
		});
	});
})(jQuery);