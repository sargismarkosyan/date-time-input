(function (dateTimeInput) {
  var deleteInputTypes = [
    'deleteWordBackward',
    'deleteWordForward',
    'deleteSoftLineBackward',
    'deleteSoftLineForward',
    'deleteEntireSoftLine',
    'deleteHardLineBackward',
    'deleteHardLineForward',
    'deleteByDrag',
    'deleteByCut',
    'deleteContent',
    'deleteContentBackward',
    'deleteContentForward'
  ];

  dateTimeInput.util.event = {
    isDeleteInputEvent: isDeleteInputEvent
  };

  function isDeleteInputEvent(e) {
    var inputType = e.inputType;
    return deleteInputTypes.indexOf(inputType) > -1;
  }
})(dateTimeInput);
