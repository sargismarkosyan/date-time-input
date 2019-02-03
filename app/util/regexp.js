(function (dateTimeInput) {
  dateTimeInput.util.regexp = {
    escapeRegExp: escapeRegExp
  };

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
   * Escaping user input that is to be treated as a literal string within a regular expression—that would otherwise be mistaken for a special character—can be accomplished by simple replacement:
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
})(dateTimeInput);
