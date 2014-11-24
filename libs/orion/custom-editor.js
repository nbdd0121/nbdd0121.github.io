define("norlit/orion/annotations", [
	"orion/editor/editor",
	"orion/editor/annotations"
], function(mEditor, mAnnotations) {

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
})

require("norlit/orion/annotations");