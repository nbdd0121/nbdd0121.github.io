// define('norlit/orion/edit', [ //$NON-NLS-0$
// 	"orion/editor/textView", //$NON-NLS-0$
// 	"orion/editor/textModel", //$NON-NLS-0$
// 	"orion/editor/textTheme", //$NON-NLS-0$
// 	"orion/editor/projectionTextModel", //$NON-NLS-0$
// 	"orion/editor/eventTarget", //$NON-NLS-0$
// 	"orion/keyBinding", //$NON-NLS-0$
// 	"orion/editor/rulers", //$NON-NLS-0$
// 	"orion/editor/annotations", //$NON-NLS-0$
// 	"orion/editor/tooltip", //$NON-NLS-0$
// 	"orion/editor/undoStack", //$NON-NLS-0$
// 	"orion/editor/textDND", //$NON-NLS-0$

// 	"orion/editor/editor", //$NON-NLS-0$
// 	"orion/editor/editorFeatures", //$NON-NLS-0$

// 	"orion/editor/contentAssist", //$NON-NLS-0$
// 	"webtools/cssContentAssist", //$NON-NLS-0$
// 	"webtools/htmlContentAssist", //$NON-NLS-0$

// 	"orion/editor/AsyncStyler", //$NON-NLS-0$
// 	"orion/editor/mirror", //$NON-NLS-0$
// 	"orion/editor/textMateStyler", //$NON-NLS-0$
// 	"orion/editor/htmlGrammar", //$NON-NLS-0$
// 	"orion/editor/textStyler", //$NON-NLS-0$
// 	"orion/editor/stylers/application_javascript/syntax", //$NON-NLS-0$
// 	"orion/editor/stylers/text_css/syntax", //$NON-NLS-0$
// 	"orion/editor/stylers/text_html/syntax" //$NON-NLS-0$

// ], function(mTextView, mTextModel, mTextTheme, mProjModel, mEventTarget, mKeyBinding, mRulers, mAnnotations,
// 	mTooltip, mUndoStack, mTextDND, mEditor, mEditorFeatures, mContentAssist, mCSSContentAssist, mHtmlContentAssist,
// 	mAsyncStyler, mMirror, mTextMateStyler, mHtmlGrammar, mTextStyler, mJS, mCSS, mHTML) {
// 	/**	@private */
// 	function getDisplay(window, document, element) {
// 		var display;
// 		var temp = element;
// 		while (temp && temp !== document && display !== "none") { //$NON-NLS-0$
// 			if (window.getComputedStyle) {
// 				var style = window.getComputedStyle(temp, null);
// 				display = style.getPropertyValue("display"); //$NON-NLS-0$
// 			} else {
// 				display = temp.currentStyle.display;
// 			}
// 			temp = temp.parentNode;
// 		}
// 		if (!temp || !display) {
// 			return "none"; //$NON-NLS-0$
// 		}
// 		return display;
// 	}

// 	/**	@private */
// 	function getTextFromElement(element) {
// 		var firstChild = element.firstChild;
// 		if (firstChild && firstChild.tagName === "TEXTAREA") { //$NON-NLS-0$
// 			return firstChild.value;
// 		}
// 		var document = element.ownerDocument;
// 		var window = document.defaultView || document.parentWindow;
// 		if (!window.getSelection ||
// 			(element.childNodes.length === 1 && firstChild.nodeType === Node.TEXT_NODE) ||
// 			getDisplay(window, document, element) === "none") //$NON-NLS-0$
// 		{
// 			return element.innerText || element.textContent;
// 		}
// 		var newRange = document.createRange();
// 		newRange.selectNode(element);
// 		var selection = window.getSelection();
// 		var oldRanges = [],
// 			i;
// 		for (i = 0; i < selection.rangeCount; i++) {
// 			oldRanges.push(selection.getRangeAt(i));
// 		}
// 		selection.removeAllRanges();
// 		selection.addRange(newRange);
// 		var text = selection.toString();
// 		selection.removeAllRanges();
// 		for (i = 0; i < oldRanges.length; i++) {
// 			selection.addRange(oldRanges[i]);
// 		}
// 		return text;
// 	}

// 	/**	@private */
// 	function merge(obj1, obj2) {
// 		for (var p in obj2) {
// 			if (obj2.hasOwnProperty(p)) {
// 				obj1[p] = obj2[p];
// 			}
// 		}
// 	}

// 	/**	@private */
// 	function getHeight(node) {
// 		return node.clientHeight;
// 	}

// 	*
// 	 * @class This object describes the options for <code>edit</code>.
// 	 * @name orion.editor.EditOptions
// 	 *
// 	 * @property {String|DOMElement} parent the parent element for the view, it can be either a DOM element or an ID for a DOM element.
// 	 * @property {Boolean} [readonly=false] whether or not the view is read-only.
// 	 * @property {Boolean} [fullSelection=true] whether or not the view is in full selection mode.
// 	 * @property {Boolean} [tabMode=true] whether or not the tab keypress is consumed by the view or is used for focus traversal.
// 	 * @property {Boolean} [expandTab=false] whether or not the tab key inserts white spaces.
// 	 * @property {String} [themeClass] the CSS class for the view theming.
// 	 * @property {Number} [tabSize=4] The number of spaces in a tab.
// 	 * @property {Boolean} [singleMode=false] whether or not the editor is in single line mode.
// 	 * @property {Boolean} [wrapMode=false] whether or not the view wraps lines.
// 	 * @property {Boolean} [wrapable=false] whether or not the view is wrappable.
// 	 * @property {Function} [statusReporter] a status reporter.
// 	 * @property {String} [title=""] the editor title.
// 	 * @property {String} [contents=""] the editor contents.
// 	 * @property {String} [lang] @deprecated use contentType instead
// 	 * @property {String} [contentType] the type of the content (eg.- application/javascript, text/html, etc.)
// 	 * @property {Boolean} [showLinesRuler=true] whether or not the lines ruler is shown.
// 	 * @property {Boolean} [showAnnotationRuler=true] whether or not the annotation ruler is shown.
// 	 * @property {Boolean} [showOverviewRuler=true] whether or not the overview ruler is shown.
// 	 * @property {Boolean} [showFoldingRuler=true] whether or not the folding ruler is shown.
// 	 * @property {Boolean} [showZoomRuler=false] whether or not the zoom ruler is shown.
// 	 * @property {Boolean} [noFocus=false] whether or not to focus the editor on creation.
// 	 * @property {Number} [firstLineIndex=1] the line index displayed for the first line of text.

// 	/**
// 	 * Creates an editor instance configured with the given options.
// 	 *
// 	 * @param {orion.editor.EditOptions} options the editor options.
// 	 */
// 	function edit(options) {
// 		var doc = document;
// 		var parent = options.parent;
// 		options.lang = 'application/javascript';

// 		var textViewFactory = function() {
// 			return new mTextView.TextView({
// 				parent: parent,
// 				model: new mProjModel.ProjectionTextModel(options.model ? options.model : new mTextModel.TextModel("")),
// 				tabSize: 4,
// 				wrapMode: true,
// 				wrappable: true
// 			});
// 		};

// 		var contentAssist, contentAssistFactory;
// 		if (!options.readonly) {
// 			contentAssistFactory = {
// 				createContentAssistMode: function(editor) {
// 					contentAssist = new mContentAssist.ContentAssist(editor.getTextView());
// 					var contentAssistWidget = new mContentAssist.ContentAssistWidget(contentAssist);
// 					var result = new mContentAssist.ContentAssistMode(contentAssist, contentAssistWidget);
// 					contentAssist.setMode(result);
// 					return result;
// 				}
// 			};
// 		}

// 		var syntaxHighlighter = {
// 			styler: null,

// 			highlight: function(contentType, editor) {
// 				if (this.styler && this.styler.destroy) {
// 					this.styler.destroy();
// 				}
// 				this.styler = null;

// 				if (contentType != "application/javascript") {
// 					throw new Error('highlight not supported');
// 				}

// 				var textView = editor.getTextView();
// 				var annotationModel = editor.getAnnotationModel();
// 				require(["orion/editor/stylers/application_javascript/syntax"], //$NON-NLS-1$ //$NON-NLS-0$
// 					function(grammar) {
// 						var stylerAdapter = new mTextStyler.createPatternBasedAdapter(grammar.grammars, grammar.id);
// 						this.styler = new mTextStyler.TextStyler(textView, annotationModel, stylerAdapter);
// 					},
// 					function(error) {}
// 				);
// 			}
// 		};

// 		var editor = new mEditor.Editor({
// 			textViewFactory: textViewFactory,
// 			undoStackFactory: new mEditorFeatures.UndoFactory(),
// 			annotationFactory: new mEditorFeatures.AnnotationFactory(),
// 			lineNumberRulerFactory: new mEditorFeatures.LineNumberRulerFactory(),
// 			foldingRulerFactory: new mEditorFeatures.FoldingRulerFactory(),
// 			textDNDFactory: new mEditorFeatures.TextDNDFactory(),
// 			contentAssistFactory: contentAssistFactory,
// 			keyBindingFactory: new mEditorFeatures.KeyBindingsFactory(),
// 			domNode: parent
// 		});

// 		editor.addEventListener("TextViewInstalled", function() { //$NON-NLS-0$
// 			var ruler = editor.getLineNumberRuler();
// 			var sourceCodeActions = editor.getSourceCodeActions();
// 			if (sourceCodeActions) {
// 				sourceCodeActions.setAutoPairParentheses(options.autoPairParentheses);
// 				sourceCodeActions.setAutoPairBraces(options.autoPairBraces);
// 				sourceCodeActions.setAutoPairSquareBrackets(options.autoPairSquareBrackets);
// 				sourceCodeActions.setAutoPairAngleBrackets(options.autoPairAngleBrackets);
// 				sourceCodeActions.setAutoPairQuotations(options.autoPairQuotations);
// 				sourceCodeActions.setAutoCompleteComments(options.autoCompleteComments);
// 				sourceCodeActions.setSmartIndentation(options.smartIndentation);
// 			}
// 		});

// 		var contents = getTextFromElement(parent);

// 		editor.installTextView();
// 		editor.setLineNumberRulerVisible(options.showLinesRuler === undefined || options.showLinesRuler);
// 		editor.setAnnotationRulerVisible(options.showAnnotationRuler === undefined || options.showFoldingRuler);
// 		editor.setOverviewRulerVisible(options.showOverviewRuler === undefined || options.showOverviewRuler);
// 		editor.setZoomRulerVisible(options.showZoomRuler === undefined || options.showZoomRuler);
// 		editor.setFoldingRulerVisible(options.showFoldingRuler === undefined || options.showFoldingRuler);
// 		editor.setInput(options.title, null, contents, false, options.noFocus);

// 		syntaxHighlighter.highlight(options.contentType || options.lang, editor);
// 		if (contentAssist) {
// 			var cssContentAssistProvider = new mCSSContentAssist.CssContentAssistProvider();
// 			var htmlContentAssistProvider = new mHtmlContentAssist.HTMLContentAssistProvider();
// 			contentAssist.addEventListener("Activating", function() { //$NON-NLS-0$
// 				if (/css$/.test(options.lang)) {
// 					contentAssist.setProviders([cssContentAssistProvider]);
// 				} else if (/html$/.test(options.lang)) {
// 					contentAssist.setProviders([htmlContentAssistProvider]);
// 				}
// 			});
// 		}
// 		/*
// 		 * The minimum height of the editor is 50px. Do not compute size if the editor is not
// 		 * attached to the DOM or it is display=none.
// 		 */
// 		var window = doc.defaultView || doc.parentWindow;
// 		if (!options.noComputeSize && getDisplay(window, doc, parent) !== "none" && getHeight(parent) <= 50) { //$NON-NLS-0$
// 			var height = editor.getTextView().computeSize().height;
// 			parent.style.height = height + "px"; //$NON-NLS-0$
// 		}
// 		return editor;
// 	}

// 	var editorNS = this.orion ? this.orion.editor : undefined;
// 	if (editorNS) {
// 		for (var i = 0; i < arguments.length; i++) {
// 			merge(editorNS, arguments[i]);
// 		}
// 		editorNS.edit = edit;
// 	}

// 	return edit;
// });


define("norlit/editor", [
	"orion/editor/editor",
	"orion/editor/annotations",
	"orion/editor/contentAssist"
], function(mEditor, mAnnotations, mContentAssist) {
	var exports = {};

	var annotationMap = {
		"error": mAnnotations.AnnotationType.ANNOTATION_ERROR,
		"warning": mAnnotations.AnnotationType.ANNOTATION_WARNING
	};

	mEditor.Editor.prototype.addAnnotationMark = function(type, message, ptr, pend) {
		if (!annotationMap.hasOwnProperty(type)) {
			throw new Error("Invalid argument: type '" + type + "' is not supported");
		}
		if (pend === undefined) {
			pend = ptr;
		}
		var model = this.getAnnotationModel();
		var marker = mAnnotations.AnnotationType.createAnnotation(annotationMap[type], ptr, pend, message);
		model.addAnnotation(marker);
	};

	mEditor.Editor.prototype.removeAllAnnotationMarks = function() {
		var model = this.getAnnotationModel();
		Object.getOwnPropertyNames(annotationMap).forEach(function(a) {
			model.removeAnnotations(annotationMap[a]);
		});
	}

	var keywords = [
		"break", "case", "catch", "continue", "debugger", "default", "delete", "do",
		"else", "finally", "for", "function", "if", "in", "instanceof", "new",
		"return", "switch", "this", "throw", "try", "typeof", "var", "void",
		"while", "with", "null", "true", "false"
	];

	function getType(id) {
		if (id == "null") {
			return "Null";
		} else if (id == "true" || id == "false") {
			return "Boolean";
		} else {
			return "";
		}
	}

	exports.contentAssist = {
		computeProposals: function(buffer, offset, context) {
			console.log(arguments);
			return keywords.filter(function(k) {
				return k.indexOf(context.prefix) == 0;
			}).map(function(k) {
				var type = getType(k);
				var proposal = {
					proposal: k.substring(context.prefix.length),
					description: type ? k + " : " + type : k
				};
				return proposal;
			});
		}
	}

	return exports;
})

require("norlit/editor");