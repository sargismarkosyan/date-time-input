(function (dateTimeInput) {
  function Calendar(element, options, defaultOptions) {
    this.element = element;
    this.options = _.clone(defaultOptions);
    this.show = _.noop;
    this.hide = _.noop;
    this.destroy = _.noop;
    this.shouldShow = _.noop;
    this.shouldHide = _.noop;
    this.isCompleted = _.noop;
    this.onOptionsChange = _.noop;

    this.setOptions(options);
    this.attachListeners();
  }

  Calendar.onDateSelectHoursAction = {
    unchanged: 'unchanged',
    start: 'start',
    end: 'end'
  };

  Calendar.prototype.setOptions = function (options) {
    _.extend(this.options, options);
    this.onOptionsChange(options);
  };

  Calendar.prototype.attachListeners = function () {
    var self = this;

    self.element.addEventListener('focus', function (e) {
      self.onFocusHandler(e);
    });

    self.element.addEventListener('focusout', function (e) {
      self.onFocusoutHandler(e);
    });

    self.element.addEventListener('input', function (e) {
      self.onInputHandler(e);
    });
  };

  Calendar.prototype.onFocusHandler = function (e) {
    if (this.shouldShow()) {
      this.show();
    }
  };

  Calendar.prototype.onFocusoutHandler = function (e) {
    if (this.shouldHide()) {
      this.hide();
    }
  };

  Calendar.prototype.onInputHandler = function (e) {
    if (this.isCompleted()) {
      this.hide();
    }
  };

  dateTimeInput.Calendar = Calendar;
})(dateTimeInput);
