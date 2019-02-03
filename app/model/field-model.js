(function (dateTimeInput) {
  function Field(element, pattern, bindInput) {
    if (bindInput === undefined) {
      bindInput = true;
    }

    this.element = element;
    this.pattern = pattern;
    this.disableFocus = false;
    this.selectedSection = undefined;
    this.valueModifyListeners = [];

    this.formatField();
    this.attachListeners(bindInput);
    this.oldValue = this.element.value;
  }

  Field.prototype.attachListeners = function (bindInput) {
    var self = this;

    self.element.addEventListener('focus', function (e) {
      if (!self.disableFocus) {
        self.onFocusHandler(e);
      }
    });

    self.element.addEventListener('mousedown', function (e) {
      self.onMouseDownHandler(e);
    });

    self.element.addEventListener('mouseup', function (e) {
      self.onMouseUpHandler(e);
    });

    self.element.addEventListener('keydown', function (e) {
      self.onKeyDownHandler(e);
    });

    if (bindInput) {
      self.element.addEventListener('input', function (e) {
        self.inputEventListener(e);
      });
    }
  };

  Field.prototype.modifyElementValue = function (value) {
    this.element.value = value;
    _.each(this.valueModifyListeners, function (item) {
      item();
    });
  };

  Field.prototype.inputEventListener = function (e) {
    this.onInputHandler(e);
    this.oldValue = this.element.value;
  };

  Field.prototype.formatField = function () {
    var date = this.pattern.stringToDate(this.element.value);
    this.element.value = this.pattern.dateToString(date);
  };

  Field.prototype.onFocusHandler = function (e) {
    this.setSelectedSection(_.first(this.pattern.sections));
  };

  Field.prototype.onMouseDownHandler = function (e) {
    var self = this;

    if (!this.pattern.isEmpty(this.element.value)) {
      this.disableFocus = true;
    }

    setTimeout(function () {
      self.disableFocus = false;
    });
  };

  Field.prototype.onMouseUpHandler = function (e) {
    var focusedSection = this.pattern.getSectionByIndex(this.element.value, this.element.selectionStart, true);
    this.setSelectedSection(focusedSection);
  };

  Field.prototype.onKeyDownHandler = function (e) {
    var prevSection, nextSection;
    var tab = 'Tab';
    var arrowLeft = 'ArrowLeft';
    var arrowUp = 'ArrowUp';
    var arrowRight = 'ArrowRight';
    var arrowDown = 'ArrowDown';

    switch (e.key) {
      case arrowUp:
        if (!this.selectedSection) {
          return;
        }

        this.modifyElementValue(this.pattern.modifySectionValue(this.element.value, this.selectedSection, 1));
        this.selectSelectedSection();
        e.preventDefault();
        break;
      case arrowDown:
        if (!this.selectedSection) {
          return;
        }

        this.modifyElementValue(this.pattern.modifySectionValue(this.element.value, this.selectedSection, -1));
        this.selectSelectedSection();
        e.preventDefault();
        break;
      case arrowLeft:
        if (e.shiftKey) {
          break;
        }

        prevSection = this.pattern.getPrevSection(this.selectedSection, true);
        if (prevSection) {
          this.setSelectedSection(prevSection);
        }
        e.preventDefault();
        break;
      case arrowRight:
        if (e.shiftKey) {
          break;
        }

        nextSection = this.pattern.getNextSection(this.selectedSection, true);
        if (nextSection) {
          this.setSelectedSection(nextSection);
        }
        e.preventDefault();
        break;
      case tab:
        if (e.shiftKey) {
          prevSection = this.pattern.getPrevSection(this.selectedSection, true);
          if (prevSection) {
            this.setSelectedSection(prevSection);
            e.preventDefault();
          }

          break;
        }

        nextSection = this.pattern.getNextSection(this.selectedSection, true);
        if (nextSection) {
          this.setSelectedSection(nextSection);
          e.preventDefault();
        }
        break;
    }
  };

  Field.prototype.onInputHandler = function (e) {
    var self = this;
    var newValue = this.element.value;
    var date = dateTimeInput.util.date.stringToDate(newValue, true);
    var patternDate = this.pattern.stringToDate(newValue);
    if (date && !dateTimeInput.util.event.isDeleteInputEvent(e) && !e.data && !patternDate) {
      var patternStr = this.pattern.dateToString(date);
      if (patternStr !== newValue) {
        this.element.value = this.pattern.dateToString(date);
      }

      return;
    }

    var results = [];
    var useData = true;
    var sectionValues = this.pattern.getSectionValues(newValue);
    var affectedSections = this.pattern.getChangedSections(this.oldValue, newValue);
    _.each(affectedSections, function (item) {
      var result = item.section.processInput(e, item.newValue, item.oldValue, useData);
      result.section = item.section;
      if (result.usedData) {
        useData = false;
      }
      _.set(sectionValues, item.index, result.validValue);
      results.push(result);
    });

    this.element.value = sectionValues.join('');

    var emptySection = _.find(results, {
      status: dateTimeInput.Section.status.empty
    });
    var invalidSection = _.find(results, {
      status: dateTimeInput.Section.status.invalid
    });
    var completedSection = _.find(results, {
      status: dateTimeInput.Section.status.completed
    });
    var extendableSection = _.find(results, {
      status: dateTimeInput.Section.status.extendable
    });
    var nextActiveSection;
    if (emptySection || invalidSection || extendableSection) {
      nextActiveSection = _([emptySection, invalidSection, extendableSection])
        .compact()
        .map('section')
        .minBy(function (section) {
          return self.pattern.sections.indexOf(section);
        });
    } else if (completedSection) {
      nextActiveSection = self.pattern.getNextSection(completedSection.section, true);
    }

    if (nextActiveSection) {
      this.setSelectedSection(nextActiveSection);
    } else {
      this.selectSelectedSection();
    }
  };

  Field.prototype.setSelectedSection = function (section) {
    if (this.selectedSection && this.selectedSection !== section) {
      this.selectedSection.clearQueue();
    }

    this.selectedSection = section;
    if (!section) {
      return;
    }

    this.selectSelectedSection();
  };

  Field.prototype.selectSelectedSection = function () {
    var corners = this.pattern.getSectionCorners(this.element.value, this.selectedSection);
    if (corners.start !== this.element.selectionStart || corners.end !== this.element.selectionEnd) {
      this.element.setSelectionRange(corners.start, corners.end, 'forward');
    }
  };

  dateTimeInput.Field = Field;
})(dateTimeInput);
