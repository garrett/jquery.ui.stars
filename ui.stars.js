/*
 * jQuery UI Stars v1.1
 *
 * Copyright (c) 2008 Orkan (orkans@gmail.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Depends:
 *	ui.core.js
 *
 */
;(function($) {

	$.widget("ui.stars", {
		init: function() {
      var self = this, o = this.options;
      o.isSelect = o.inputType == "select";
      
      this.$selec = o.isSelect ? $("select", this.element) : null;
      this.$rboxs = o.isSelect ? $("option", this.$selec) : $(":radio", this.element);

      this.$stars = this.$rboxs.map(function(i) {
        if(i==0) {
          o.split = typeof o.split != "number" ? 0 : o.split;
          o.val2id = [];
          o.id2val = [];
          o.id2title = [];
          o.name = o.isSelect ? self.$selec.get(0).name : this.name;
          o.disabled = o.disabled || (o.isSelect ? $(self.$selec).attr('disabled') : $(this).attr('disabled'));
          o.items = 0;
        }
        o.items++;

        o.val2id[this.value] = i;
        o.id2val[i] = this.value;
        o.id2title[i] = (o.isSelect ? this.text : this.title) || this.value;

        if(o.selected==i || (o.selected==-1 && (o.isSelect ? this.defaultSelected : this.defaultChecked) )) {
          o.checked = i;
          o.value = o.id2val[i];
          o.title = o.id2title[i];
        }

        var $s = $("<div/>").addClass(o.starClass);
        var $a = $('<a/>').attr("title", o.showTitles ? o.id2title[i] : "").text(this.value);
        
        // Prepare division settings
        if(o.split) {
          var oddeven = (i % o.split);
          var stwidth = Math.floor(o.starWidth / o.split);
          $s.width(stwidth);
          $a.css("margin-left", "-"+(oddeven*stwidth)+"px");
        }

        return $s.append($a).get(0);
      });
      
      this.$cancel = $("<div/>").addClass(o.cancelClass).append( $("<a/>").attr("title", o.showTitles ? o.cancelTitle : "").text(o.cancelValue) );
      this.$value = $('<input type="hidden" name="'+o.name+'" value="'+o.value+'" />');

      o.cancelShow &= !o.disabled && !o.oneVoteOnly;

      // Stars interface
      if(o.cancelShow) this.element.append(this.$cancel);
      this.element.append(this.$stars);
      this.element.append(this.$value);
      
      // Replace content
      o.isSelect ? this.$selec.remove() : this.$rboxs.remove();

      // Initial selection
      if(o.checked === undefined) {
          o.checked = -1;
          o.value = o.cancelValue;
          o.title = "";
          if(o.cancelShow) this._disableCancel();
      }
      else {
        fillTo(o.checked, false);
      }

      if(o.disabled) this.disable();


      // Clean up to avoid memory leaks in certain versions of IE 6
      $(window).bind("unload", function(){
        self.$cancel.unbind(".stars");
        self.$stars.unbind(".stars");
        self.$selec = self.$rboxs = self.$stars = self.$value = self.$cancel = null;
      });

      // Remove selection
      function fillNone() {
          self.$stars.removeClass([o.starOnClass, o.starHoverClass].join(' '));
          self._showCap("");
      }
      
      // Fill stars to the current index
      function fillTo(index, hover) {
        if(index != -1) {
          var addClass = hover ? o.starHoverClass : o.starOnClass;
          var remClass = hover ? o.starOnClass : o.starHoverClass;
          self.$stars.eq(index).prevAll("."+o.starClass).andSelf().removeClass(remClass).addClass(addClass);
          self.$stars.eq(index).nextAll("."+o.starClass).removeClass([o.starHoverClass, o.starOnClass].join(' '));
          self._showCap(o.id2title[index]);
        }
        else fillNone();
      }

      // Attach star event handler
      this.$stars.bind("click.stars", function() {
          if(!o.forceSelect && o.disabled) return false;
          
          var i = self.$stars.index(this);
          o.checked = i;
          o.value = o.id2val[i];
          o.title = o.id2title[i];
          self.$value.attr({disabled: o.disabled ? "disabled" : "", value: o.value});

          fillTo(i, false);
          self._disableCancel();

          if(!o.forceSelect) {
            //self.disable();
            self.callback("star");
          }
        })
        .bind("mouseover.stars", function() {
          if(o.disabled) return false;
          var i = self.$stars.index(this);
          fillTo(i, true);
        })
        .bind("mouseout.stars", function() {
          if(o.disabled) return false;
          fillTo(self.options.checked, false);
        });

      this.$cancel.bind("click.stars", function() {
          if( !o.forceSelect && (o.disabled || (o.value == o.cancelValue)) ) return false;
          
          o.checked = -1;
          o.value = o.cancelValue;
          o.title = "";
          self.$value.attr({value: o.value, disabled: "disabled"});
          
          fillNone();
          self._disableCancel();
          
          if(!o.forceSelect) {
            //self.disable();
            self.callback("cancel");
          }
        })
        .bind("mouseover.stars", function() {
          if(self._disableCancel()) return false;
          self.$cancel.addClass(o.cancelHoverClass);
          fillNone();
          self._showCap(o.cancelTitle);
        })
        .bind("mouseout.stars", function() {
          if(self._disableCancel()) return false;
          self.$cancel.removeClass(o.cancelHoverClass);
          self.$stars.triggerHandler("mouseout.stars");
        });

		},
		select: function(val) {
      var o = this.options;
      o.forceSelect = true;
      if(val==o.cancelValue) this.$cancel.triggerHandler("click.stars");
      else                   this.$stars.eq(o.val2id[val]).triggerHandler("click.stars");
      o.forceSelect = false;
		},
		selectID: function(id) {
      var o = this.options;
      o.forceSelect = true;
      if(id==-1)  this.$cancel.triggerHandler("click.stars");
      else        this.$stars.eq(id).triggerHandler("click.stars");
      o.forceSelect = false;
		},
  	enable: function() {
			this.options.disabled = false;
      this._disableAll();
		},
		disable: function() {
			this.options.disabled = true;
      this._disableAll();
		},
		_disableCancel: function() {
        var o = this.options, disabled = o.disabled || o.oneVoteOnly || (o.value == o.cancelValue);
        if(disabled)  this.$cancel.removeClass(o.cancelHoverClass).addClass(o.cancelDisabledClass);
        else          this.$cancel.removeClass(o.cancelDisabledClass);
        this.$cancel.css("opacity", disabled ? 0.5 : 1);
        return disabled;
		},
		_disableAll: function() {
      var o = this.options;
      this._disableCancel();
      if(o.disabled)  this.$stars.filter("div").addClass(o.starDisabledClass);
      else            this.$stars.filter("div").removeClass(o.starDisabledClass);
		},
		_showCap: function(s) {
      var o = this.options;
			if(o.captionEl) o.captionEl.text(s);
		},
    destroy: function() {
      this.options.isSelect ? this.$selec.appendTo(this.element) : this.$rboxs.appendTo(this.element);
      this.$cancel.unbind('.stars').remove();
      this.$stars.unbind('.stars').remove();
      this.$value.remove();
      this.element.unbind('.stars').removeData('stars');
    },
    callback: function(type) {
      var o = this.options;
      o.callback(this, type, o.value);
      if(o.oneVoteOnly && !o.disabled) this.disable();
    }
  });


	$.ui.stars.defaults = {
    inputType: "radio", // radio|select
		split: 0,
    selected: -1,
    disabled: false,
    cancelTitle: "Cancel Rating",
		cancelValue: 0,
    cancelShow: true,
    oneVoteOnly: false,
    showTitles: false,
    captionEl: null,
    callback: function(el,type,value){},

    // CSS classes
    starWidth: 16,
    cancelClass: 'ui-stars-cancel',
		starClass: 'ui-stars-star',
		starOnClass: 'ui-stars-star-on',
		starHoverClass: 'ui-stars-star-hover',
		starDisabledClass: 'ui-stars-star-disabled',
		cancelHoverClass: 'ui-stars-cancel-hover',
		cancelDisabledClass: 'ui-stars-cancel-disabled'
  };

})(jQuery);