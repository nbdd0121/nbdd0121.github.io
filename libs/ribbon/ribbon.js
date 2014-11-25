(function($) {
	$.invokeLater = function(func) {
		setTimeout(func, 0);
	};

	var Ribbon = {
		dropDown: $('<div class="x-menu-dropdown" style="display:none;">'),
		tabs: {},
		current: null
	};

	function popupMenuHandler(event) {
		var target = $(event.target);
		if (!target.is(".x-menu-dropdown") && !target.parents(".x-menu-dropdown").length) {
			Ribbon.hideTab();
		}
	}

	Ribbon.showTab = function(name) {
		var tab = this.tabs[name];
		if (!tab) {
			throw new Error('No such tab');
		}
		this.current = name;
		$('.x-menu-tab').hide();
		$(tab).show();
		if (this.dropDown.is(':hidden')) {
			this.dropDown.fadeIn(300);
		}
		$.invokeLater(function() {
			$(document.body).click(popupMenuHandler);
		});
	}
	Ribbon.hideTab = function() {
		this.current = null;
		this.dropDown.fadeOut(300);
		$(document.body).unbind('click', popupMenuHandler);
	}
	$(function() {
		var tabs = $(".x-menu-tab").remove();
		for (var i = 0; i < tabs.length; i++) {
			Ribbon.tabs[$(tabs[i]).attr('tabName')] = tabs[i];
		}
		Ribbon.dropDown.appendTo(document.body).append(tabs);

		// Initialize all menu groups
		var groups = $(".x-menu-tab [xRole=group]");
		for (var i = 0; i < groups.length; i++) {
			var item = $(groups[i]);
			item.append($('<span>').text(item.attr('label')));
		}

		// Initialize all buttons in drop down menu
		var buttons = $(".x-menu-tab [xRole=button]");
		for (var i = 0; i < buttons.length; i++) {
			var item = $(buttons[i]);
			item.append($('<img>').attr('src', item.attr('xIcon')));
			item.append($('<span>').html(item.attr('xText')));
		}

		// Initialize tab buttons
		var tabbuttons = $(".tabbutton[xTarget]");
		for (var i = 0; i < tabbuttons.length; i++) {
			var item = $(tabbuttons[i]);
			var target = item.attr('xTarget');
			item.click(function(target) {
				return function() {
					if (Ribbon.current != target)
						Ribbon.showTab(target);
				}
			}(target));
		}

		var toggleButtons = $("[xBehavior=toggle]");
		for (var i = 0; i < toggleButtons.length; i++) {
			var item = $(toggleButtons[i]);
			item.click(function(event) {
				var target = $(event.currentTarget);
				target.ribbon('toggle');
				target.change();
			})
		}
	});

	$.fn.ribbon = function(method, arg) {
		if (this.length != 1) {
			throw '';
		}
		var role = this.attr('xRole');
		switch (role) {
			case 'button':
				switch (method) {
					case 'toggle':
						{
							var newVal = !this.ribbon('value');
							this.ribbon('value', newVal);
							return newVal;
						}
					case 'value':
						if (arg === undefined) {
							return this.attr('active') !== undefined;
						} else {
							if (arg) {
								this.attr('active', '');
							} else {
								this.removeAttr('active');
							}
							return this;
						}
				}
				throw '';
		}
		throw '';
	}

	window.Ribbon = Ribbon;
})(jQuery);