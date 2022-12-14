/**
 * EditingHistory.js COPYRIGHT FUJITSU LIMITED 2021
 */
import {action, observable} from 'mobx';

import editingVocabularyStore from './EditingVocabulary';

/**
 * History information management class
 */
class EditingHistory {
  /**
   * constructor
   */
  constructor() {
    this._undoMessage = this.STR_HISTORY_NONE;
    this._redoMessage = this.STR_HISTORY_NONE;
  }

  // Operation history stack list
  @observable undoStack = [];
  @observable undoPointer = null;

  /**
   * Maximum number of items that can be stacked
   */
  get UNDO_STACK_MAX() {
    return 10;
  }

  /**
   * undo string
   */
  get STR_UNDO() {
    return 'undo';
  }

  /**
   * redo string
   */
  get STR_REDO() {
    return 'redo';
  }

  /**
   * Operation history initialization
   */
  @action initUndoStack() {
    this.undoStack = [];
    this.undoPointer = null;
  }

  /**
   * Move pointer after undo/redo
   * @param  {string} type 'undo' or 'redo' string.
   */
  movePointer(type) {
    if (null == this.undoPointer) return;

    if (this.STR_UNDO === type) {
      if (this.undoPointer > 0) {
        this.undoPointer = --this.undoPointer;
      }
    } else { // redo
      if (this.undoPointer < 10) {
        this.undoPointer = ++this.undoPointer;
      }
    }
  }

  /**
   * Add history
   * @param {object} history - information of history
   */
  @action addHistory(history) {
    //console.log('[addHistory] history :' + JSON.stringify(history) );

    if (this.undoPointer == null) {
      this.undoStack.push(history);
      this.undoPointer = 1;
    } else {
      const delHistoryNum = this.undoStack.length - this.undoPointer;
      this.undoStack.splice(this.undoPointer, delHistoryNum, history);
      if (this.undoStack.length > this.UNDO_STACK_MAX) {
        this.undoStack.shift();
      }
      this.undoPointer = this.undoStack.length;
    }

    // console.log('[addHistory] undoPointer :' + this.undoPointer );
    // console.log('[addHistory] undoStack.length :' + this.undoStack.length );
  }

  /**
   * Get an editing vocabulary
   * @param  {number} id - id
   * @return {string} - vocabulary
   */
  getTermFromEditingVocabulary(id) {
    const editingVocabulary = editingVocabularyStore.editingVocabulary;

    let term = '';
    const target = editingVocabulary.find( (data) => data.id === id);
    if (target) {
      term = target.term;
    }
    return term;
  }

  // undo/redo /////////////////////////////////////////////
  /**
   * undo
   */
  @action execUndo() {
    this.setMessage(this.STR_UNDO);
    if (this._undoMessage !== this.STR_HISTORY_NONE) {
      this.execHistory(this.STR_UNDO);
      this.movePointer(this.STR_UNDO);
    }
    // console.log('[execUndo] undoPointer :' + this.undoPointer );
    // console.log('[execUndo] undoStack.length :' + this.undoStack.length );
  }

  /**
   * redo
   */
  @action execRedo() {
    this.setMessage(this.STR_REDO);
    if (this._redoMessage !== this.STR_HISTORY_NONE) {
      this.execHistory(this.STR_REDO);
      this.movePointer(this.STR_REDO);
    }
    // console.log('[execRedo] undoPointer :' + this.undoPointer );
    // console.log('[execRedo] undoStack.length :' + this.undoStack.length );
  }

  /**
   * Execute history contents
   * @param  {string} type 'undo' or 'redo' string.
   */
  execHistory(type) {
    const history = this.getHistoryByType(type);

    if (null == history) {
      // console.log(
      //     '[execHistory] ' +
      //     type +
      //     ' is not possible( pointer:' +
      //     this.undoPointer +
      //     ' ).',
      // );
      return;
    }

    switch (history.action) {
      case 'color1':
      case 'color2':
        this.execChangeColor(type, history);
        break;
      case 'vocabulary':
        this.execVocabulary(type, history);
        break;
      case 'confirmChanged':
        this.execConfirmChanged(type, history);
        break;
      case 'confirmColorChanged':
        this.execConfirmColorChanged(type, history);
        break;
      case 'position':
        this.execPosition(type, history);
        break;
      default:
        break;
    }
  }

  /**
   * Get the operation history stored in stack by undo/redo
   * @param  {string} type 'undo' or 'redo' string.
   * @return {object} - information of history
   */
  getHistoryByType(type) {
    let history = null;
    if (this.STR_UNDO === type) {
      // The condition under which undo can be performed is when undoPointer is greater than or equal to 1
      if ((this.undoPointer != null) && (this.undoPointer > 0)) {
        history = this.undoStack[this.undoPointer - 1];
      }
    } else if (this.STR_REDO === type) {
      // Redo can be executed if undoPointer is less than or equal to 9
      if ((this.undoPointer != null) && (this.undoPointer < 10)) {
        history = this.undoStack[this.undoPointer];
      }
    } else {
      // do nothing.
    }
    return history;
  }

  /**
   * Color change undo/redo execution
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {object} history - information of history
   */
  execChangeColor(type, history) {
    const currentTerm = this.getTermFromEditingVocabulary(history.targetId);
    let color;
    if (this.STR_UNDO === type) {
      color = history.previous;
    } else { // redo
      color = history.following;
    }

    const EditingVocabulary = editingVocabularyStore;
    // EditingVocabulary.setCurrentNodeByTerm(currentTerm, history.targetId);
    switch (history.action) {
      case 'color1':
        EditingVocabulary.updateColor(history.targetId, 'color1', color, true);
        break;
      case 'color2':
        EditingVocabulary.updateColor(history.targetId, 'color2', color, true);
        break;
      default:
        break;
    }
  }

  /**
   * Vocabulary information change undo/redo execution
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {object} history - information of history
   */
  execVocabulary(type, history) {
    const EditingVocabulary = editingVocabularyStore;
    const oldNode = EditingVocabulary.currentNode;
    let currentData = history.following[0];
    if (!currentData) {
      currentData = history.previous[0];
    }

    const updateList = [];
    const deleteList = [];

    if (this.STR_UNDO === type) {
      const addSynList = history.previous.filter((i) =>
        this.getIndexById(history.following, 'id', i.id) == -1);
      const upSynList = history.previous.filter((i) =>
        this.getIndexById(history.following, 'id', i.id) != -1);
      const delSynList = history.following.filter((i) =>
        this.getIndexById(history.previous, 'id', i.id) == -1);
      // console.log(
      //     '[execVocabulary] addSynList :' + JSON.stringify(addSynList),
      // );
      // console.log('[execVocabulary] upSynList :' + JSON.stringify(upSynList) );
      // console.log(
      //     '[execVocabulary] delSynList :' + JSON.stringify(delSynList),
      // );
      addSynList.forEach((data) =>{
        const addData =
            EditingVocabulary.createFromReferenceVocabulary(
                data.term,
                data.preferred_label,
                data.uri,
                data.broader_term,
                data.term_description,
            );
        // addData.position_x = data.position_x;
        // addData.position_y = data.position_y;
        updateList.push(addData);
      });
      upSynList.forEach((data) => {
        const target =
            EditingVocabulary.editingVocabulary.find((i) => i.id == data.id);
        if (target) {
          target.preferred_label = data.preferred_label;
          target.uri = data.uri;
          target.broader_term = data.broader_term;
          target.term_description = data.term_description;
          updateList.push(target);
        }
      });
      delSynList.forEach((data) => {
        const target = EditingVocabulary.editingVocabulary.find((i) =>
          i.term == data.term);
        if (target) {
          deleteList.push(target.id);
        }
      });
    } else { // redo
      const addSynList = history.following.filter((i) =>
        this.getIndexById(history.previous, 'id', i.id) == -1);
      const upSynList = history.following.filter((i) =>
        this.getIndexById(history.previous, 'id', i.id) != -1);
      const delSynList = history.previous.filter((i) =>
        this.getIndexById(history.following, 'id', i.id) == -1);
      // console.log(
      //     '[execVocabulary] addSynList :' + JSON.stringify(addSynList),
      // );
      // console.log('[execVocabulary] upSynList :' + JSON.stringify(upSynList) );
      // console.log(
      //     '[execVocabulary] delSynList :' + JSON.stringify(delSynList),
      // );
      addSynList.forEach((data) =>{
        const addData = EditingVocabulary.createFromReferenceVocabulary(
            data.term,
            data.preferred_label,
            data.uri,
            data.broader_term,
            data.term_description,
        );
        // addData.position_x = data.position_x;
        // addData.position_y = data.position_y;
        updateList.push(addData);
      });
      upSynList.forEach((data) => {
        const target = EditingVocabulary.editingVocabulary.find((i) =>
          i.id == data.id);
        if (target) {
          target.preferred_label = data.preferred_label;
          target.uri = data.uri;
          target.broader_term = data.broader_term;
          target.term_description = data.term_description;
          updateList.push(target);
        }
      });
      delSynList.forEach((data) => {
        const target = EditingVocabulary.editingVocabulary.find((i) =>
          i.term == data.term);
        if (target) {
          deleteList.push(target.id);
        }
      });
    }

    // console.log(
    //     '[makeSynonymMessage] updateList :' + JSON.stringify(updateList),
    // );
    // console.log(
    //     '[makeSynonymMessage] deleteList :' + JSON.stringify(deleteList),
    // );
    EditingVocabulary.updateRequest(updateList, deleteList, currentData, null, oldNode.term);
  }

  /**
   * Term determination undo/redo execution
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {object} history - information of history
   */
  execConfirmChanged(type, history) {
    const currentTerm = this.getTermFromEditingVocabulary(history.targetId);

    let confirm;
    if (this.STR_UNDO === type) {
      confirm = history.previous;
    } else { // redo
      confirm = history.following;
    }

    let isConfirm = false;
    if (confirm == 1) {
      isConfirm = true;
    }

    const EditingVocabulary = editingVocabularyStore;
    EditingVocabulary.setCurrentNodeByTerm(currentTerm, history.targetId);

    EditingVocabulary.toggleConfirm(currentTerm, isConfirm, true);
  }

  /**
   * Term fixing color undo/redo execution
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {object} history - information of history
   */
  execConfirmColorChanged(type, history) {
    let color;
    if (this.STR_UNDO === type) {
      color = history.previous;
    } else { // redo
      color = history.following;
    }

    const EditingVocabulary = editingVocabularyStore;
    EditingVocabulary.seletConfirmColor(color, true);
  }

  execPosition(type, history) {
    
    const EditingVocabulary = editingVocabularyStore;
    const target = EditingVocabulary.getTargetFileData(EditingVocabulary.selectedFile.id).find((obj) => {
      return (obj.id == history.targetId);
    });
    
    if (!target) {
      console.log('target is not found. id: ' + history.targetId);
      return;
    }

    let position;
    if (this.STR_UNDO === type) {
      position = history.previous;
    } else { // redo
      position = history.following;
    }
    target.position_x = position.position_x;
    target.position_y = position.position_y;
  }

  // Display message function /////////////////////////////////////////////
  _undoMessage;
  _redoMessage;

  /**
   * Get undo message
   * @return {string} undo
   */
  @action undoMessage() {
    return this._undoMessage;
  }

  /**
   * Get redo message
   * @return {string} redo
   */
  @action redoMessage() {
    return this._redoMessage;
  }

  /**
   * Get redo untracked message
   * @return {string} - Fixed characters without history
   */
  get STR_HISTORY_NONE() {
    return '???????????????????????????';
  }

  /**
   * Message creation (setting before execution)
   * @param  {string} type 'undo' or 'redo' string.
   */
  setMessage(type) {
    if (null == this.undoPointer) {
      this._undoMessage = this.STR_HISTORY_NONE;
      this._redoMessage = this.STR_HISTORY_NONE;
      return;
    }

    if (this.STR_UNDO === type) {
      if (0 == this.undoPointer) {
        this._undoMessage = this.STR_HISTORY_NONE;
        return;
      }
      this._undoMessage = this.createMessage(type, this.undoPointer - 1);
    } else {
      if (10 == this.undoPointer) {
        this._redoMessage = this.STR_HISTORY_NONE;
        return;
      }
      this._redoMessage = this.createMessage(type, this.undoPointer);
    }
  }

  // Create undo/redo message
  /**
   * Create undo/redo message
   * @param {string} type 'undo' or 'redo' string.
   * @param {number} pointer - undo pointer
   * @return {string} - message
   */
  createMessage(type, pointer) {
    if (this.undoStack.length == 0) return this.STR_HISTORY_NONE;
    if (this.undoPointer == null) return this.STR_HISTORY_NONE;

    if (this.STR_UNDO === type) {
      if (this.undoPointer == 0) {
        return this.STR_HISTORY_NONE;
      }
    } else { // redo
      if (this.undoStack.length <= this.undoPointer ) {
        return this.STR_HISTORY_NONE;
      }
    }


    const history = this.undoStack[pointer];

    let result;
    switch (history.action) {
      case 'color1':
      case 'color2':
        result = this.makeColorMessage(type, history);
        break;
      case 'vocabulary':
        result = this.makeVocabularyMessage(type, history);
        break;
      case 'confirmChanged':
        result = this.makeConfirmChangedMessage(type, history);
        break;
      case 'confirmColorChanged':
        result = this.makeConfirmColorChangedMessage(type, history);
        break;
      case 'position':
        result = this.makePositionMessage(type, history);
        break;
      default:
        result = this.STR_HISTORY_NONE;
        break;
    }
    return result;
  }

  /**
   * Create color change undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {object} history - information of history
   * @return {string} - message
   */
  makeColorMessage(type, history) {
    let message =
        '???' +
        this.getTermFromEditingVocabulary(history.targetId) +
        '????????????????????????????????????\n';

    if (history.action === 'color1' || history.action === 'color2') {
      message += '??????\n?????????';
    } else {
      console.log('invalid action has came. action: ' + history.action);
    }

    if (this.STR_UNDO === type) {
      message += '"' + history.following + '"??????"' + history.previous + '"';
    } else { // redo
      message += '"' + history.previous + '"??????"' + history.following + '"';
    }

    return message;
  }

  /**
   * Create vocabulary change undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {object} history - information of history
   * @return {string} - message
   */
  makeVocabularyMessage(type, history) {
    const previousTarget = history.previous.find((data) =>
      data.id === history.targetId);
    const followingTarget = history.following.find((data) =>
      data.id === history.targetId);

    const previousLangDiffTarget = history.previous.find((data) =>
      data.id === history.targetLangDiffId);
    const followingLangDiffTarget = history.following.find((data) =>
      data.id === history.targetLangDiffId);

    if (!previousTarget && followingTarget) {
      // If the change deletes the edited vocabulary
      if (this.STR_UNDO === type) {
        return '?????? : ' + followingTarget.term + '???????????????????????????';
      } else { // redo
        return '?????? : ' + followingTarget.term + '???????????????????????????';
      }
    }
    if (!followingTarget && previousTarget) {
      // If the change deletes the edited vocabulary
      if (this.STR_UNDO === type) {
        return '?????? : ' + previousTarget.term + '???????????????????????????';
      } else { // redo
        return '?????? : ' + previousTarget.term + '???????????????????????????';
      }
    }

    let message = '???' + previousTarget.term + '????????????????????????????????????';

    message +=
        this.makeSynonymMessage(type, history.previous, history.following);
    message +=
        this.makePreferredLabelMessage(
            type,
            previousTarget.preferred_label,
            followingTarget.preferred_label,
        );
    if( previousLangDiffTarget && followingLangDiffTarget){
      message += this.makePreferredLabelMessage(
            type,
            previousLangDiffTarget.preferred_label,
            followingLangDiffTarget.preferred_label,
        );
    }
    message +=
        this.makeUriMessage(type, previousTarget.uri, followingTarget.uri);
    message +=
        this.makeBroaderTermMessage(
            type,
            previousTarget.broader_term,
            followingTarget.broader_term,
        );
    if( previousLangDiffTarget && followingLangDiffTarget){
      message += this.makeBroaderTermMessage(
            type,
            previousLangDiffTarget.broader_term,
            followingLangDiffTarget.broader_term,
        );
    }
    message += this.makeTermDescriptionMessage(
          type, 
          previousTarget.term_description, 
          followingTarget.term_description);
    if( previousLangDiffTarget && followingLangDiffTarget){
      message += this.makeTermDescriptionMessage(
            type, 
            previousLangDiffTarget.term_description, 
            followingLangDiffTarget.term_description);
    }

    return message;
  }

  /**
   * Create term determination undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {object} history - information of history
   * @return {string} - message
   */
  makeConfirmChangedMessage(type, history) {
    const editingVocabulary = editingVocabularyStore.editingVocabulary;
    const target =
      editingVocabulary.find( (data) => data.id === history.targetId);
    if (!target) {
      console.log('target is not found. id: ' + history.targetId);
      return;
    }
    let message = '';
    if (target.preferred_label) {
      message =
          '???????????????' + target.preferred_label + '????????????????????????????????????\n';
    } else {
      message =
          '????????????' + target.term + '????????????????????????????????????\n';
    }

    let strFollow = '';
    if (history.following == 1) {
      strFollow = '??????';
    } else {
      strFollow = '?????????';
    }

    let strPrevious = '';
    if (history.previous == 1) {
      strPrevious = '??????';
    } else {
      strPrevious = '?????????';
    }

    if (this.STR_UNDO === type) {
      message += '"' + strFollow + '"??????"' + strPrevious + '"';
    } else { // redo
      message += '"' + strPrevious + '"??????"' + strFollow + '"';
    }

    return message;
  }

  /**
   * Create determined term color undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {object} history - information of history
   * @return {string} - message
   */
  makeConfirmColorChangedMessage(type, history) {
    let message = '??????????????????????????????????????????\n';

    if (this.STR_UNDO === type) {
      message += '"' + history.following + '"??????"' + history.previous + '"';
    } else { // redo
      message += '"' + history.previous + '"??????"' + history.following + '"';
    }

    return message;
  }

  /**
   * Create position move undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {object} history - information of history
   * @return {string} - message
   */
  makePositionMessage(type, history) {
    let message = '??????????????????';

    if (this.STR_UNDO === type) {
      message += '????????????????????????\n \n';
    } else { // redo
      message += '????????????????????????\n \n'
    }
    return message;
  }

  /**
   * Digits after the specified decimal point
   * @param  {number}  num - value
   * @param  {integer} digit - digits 
   * @return {number} - calc value
   */
  roundNum(num, digit ){

    if( Number(num) === Number.NaN){
      return '-';
    }
    return Math.round( Number(num) * Math.pow( 10, digit ) ) / Math.pow( 10, digit );
  }


  /**
   * Create synonym undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {array} preSynList previous - list of synonyms
   * @param  {array} flwSynList following - list of synoyms
   * @return {string}  - message
   */
  makeSynonymMessage(type, preSynList, flwSynList) {
    const currentPreData = preSynList[0];
    const currentFlwData = flwSynList[0];

    // Remove nonsynonymous terms from edited terms
    let previous = preSynList.filter((i) => i.term !== currentPreData.term);
    if (currentPreData.broader_term) {
      previous = previous.filter((i) =>
        i.term !== currentPreData.broader_term);
      previous = previous.filter((i) =>
        i.preferred_label !== currentPreData.broader_term);
    }
    if (currentPreData.preferred_label) {
      previous = previous.filter((i) =>
        i.preferred_label == currentPreData.preferred_label);
    }

    // Remove nonsynonymous terms from edited terms
    let following = flwSynList.filter((i) => i.term !== currentFlwData.term);
    if (currentFlwData.broader_term) {
      following = following.filter((i) =>
        i.term !== currentFlwData.broader_term);
      following = following.filter((i) =>
        i.preferred_label !== currentFlwData.broader_term);
    }
    if (currentFlwData.preferred_label) {
      following = following.filter((i) =>
        i.preferred_label == currentFlwData.preferred_label);
    }

    const addSynList = [];
    const delSynList = [];
    if (this.STR_UNDO === type) {
      previous.forEach((pre) => {
        const find = following.find((fllw) => fllw.term == pre.term);
        if (find) {
          if (find.preferred_label != currentFlwData.preferred_label) {
            addSynList.push(pre);
          }
        } else {
          addSynList.push(pre);
        }
      });

      following.forEach((fllw) => {
        const find = previous.find((pre) => pre.term == fllw.term);
        if (find) {
          if (find.preferred_label != currentPreData.preferred_label) {
            delSynList.push(fllw);
          }
        } else {
          delSynList.push(fllw);
        }
      });
    } else { // redo
      following.forEach((fllw) => {
        const find = previous.find((pre) => pre.term == fllw.term);
        if (find) {
          if (find.preferred_label != currentPreData.preferred_label) {
            addSynList.push(fllw);
    }
        } else {
          addSynList.push(fllw);
        }
      });
      previous.forEach((pre) => {
        const find = following.find((fllw) => fllw.term == pre.term);
        if (find) {
          if (find.preferred_label != currentFlwData.preferred_label) {
            delSynList.push(pre);
          }
        } else {
          delSynList.push(pre);
        }
      });
    }

    // console.log(
    //     '[makeSynonymMessage] addSynList :' + JSON.stringify(addSynList),
    // );
    // console.log(
    //     '[makeSynonymMessage] delSynList :' + JSON.stringify(delSynList),
    // );


    let message = '';
    if ( !(addSynList[0]) && !(delSynList[0]) ) {
      return message;
    }

    if (addSynList[0]) {
      message += '\n???????????? : ';
      addSynList.forEach((data) => {
        message += '"' + data.term + '",';
      });
      message = message.slice( 0, -1 );
      message += '????????????????????????';
    }

    if (delSynList[0]) {
      message += '\n???????????? : ';
      delSynList.forEach((data) => {
        message += '"' + data.term + '",';
      });
      message = message.slice( 0, -1 );
      message += '????????????????????????';
    }

    return message;
  }

  /**
   * Determine if a list contains search values
   * @param  {array} array - object list
   * @param  {array} key - search key
   * @param  {array} value - search value
   * @return {number} index - if -1 not found
   */
  getIndexById(array, key, value) {
    for (let i = 0; i < array.length; i++) {
      if (array[i][key] === value) return i;
    }
    return -1;
  }

  /**
   * Create preferred label undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {string} prePrfdLbl previous - preferred label
   * @param  {string} flwPrfdLbl following - preferred label
   * @return {string}
   */
  makePreferredLabelMessage(type, prePrfdLbl, flwPrfdLbl) {
    console.log(
        '[makePreferredLabelMessage] pre:' + prePrfdLbl + ', flw:' + flwPrfdLbl,
    );
    let message = '';
    if ( prePrfdLbl === flwPrfdLbl ) {
      return message;
    }

    let addWord = '';
    let delWord = '';
    if (this.STR_UNDO === type) {
      addWord = prePrfdLbl;
      delWord = flwPrfdLbl;
    } else { // redo
      addWord = flwPrfdLbl;
      delWord = prePrfdLbl;
    }

    message += '\n???????????? : ';
    if ( (addWord) && (delWord) ) {
      message += '"' + delWord + '"??????';
      message += '"' + addWord + '"????????????????????????';
    } else if (!(delWord)) {
      message += '"' + addWord + '"????????????????????????';
    } else if (!(addWord)) {
      message += '"' + delWord + '"????????????????????????';
    } else {
      // do nothing.
    }

    return message;
  }

  /**
   * Create URI undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {string} preUri previous URI
   * @param  {string} flwUri following URI
   * @return {string} - message
   */
  makeUriMessage(type, preUri, flwUri) {
    console.log('[makeUriMessage] pre:' + preUri + ', flw:' + flwUri);
    let message = '';
    if ( preUri === flwUri ) {
      return message;
    }

    let addWord = '';
    let delWord = '';
    if (this.STR_UNDO === type) {
      addWord = preUri;
      delWord = flwUri;
    } else { // redo
      addWord = flwUri;
      delWord = preUri;
    }

    message += '\n???URI : ';
    if ( (addWord) && (delWord) ) {
      message += '"' + delWord + '"??????';
      message += '"' + addWord + '"????????????????????????';
    } else if (!(delWord)) {
      message += '"' + addWord + '"????????????????????????';
    } else if (!(addWord)) {
      message += '"' + delWord + '"????????????????????????';
    } else {
      // do nothing.
    }

    return message;
  }

  /**
   * Create broader term undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {string} preBrdrTrm previous - broader term
   * @param  {string} flwBrdrTrm following - broader term
   * @return {string} - message
   */
  makeBroaderTermMessage(type, preBrdrTrm, flwBrdrTrm) {
    console.log(
        '[makeBroaderTermMessage] pre:' + preBrdrTrm + ', flw:' + flwBrdrTrm,
    );
    let message = '';
    if ( preBrdrTrm === flwBrdrTrm ) {
      return message;
    }

    let addWord = '';
    let delWord = '';
    if (this.STR_UNDO === type) {
      addWord = preBrdrTrm;
      delWord = flwBrdrTrm;
    } else { // redo
      addWord = flwBrdrTrm;
      delWord = preBrdrTrm;
    }

    message += '\n???????????? : ';
    if ( (addWord) && (delWord) ) {
      message += '"' + delWord + '"??????';
      message += '"' + addWord + '"????????????????????????';
    } else if (!(delWord)) {
      message += '"' + addWord + '"????????????????????????';
    } else if (!(addWord)) {
      message += '"' + delWord + '"????????????????????????';
    } else {
      // do nothing.
    }

    return message;
  }

  /**
   * Create term description undo/redo message
   * @param  {string} type 'undo' or 'redo' string.
   * @param  {string} preTermDescription previous term description
   * @param  {string} flwTermDescription following term description
   * @return {string} - message
   */
   makeTermDescriptionMessage(type, preTermDescription, flwTermDescription) {
    console.log('[makeUriMessage] pre:' + preTermDescription + ', flw:' + flwTermDescription);
    let message = '';
    if ( preTermDescription === flwTermDescription ) {
      return message;
    }

    let addWord = '';
    let delWord = '';
    if (this.STR_UNDO === type) {
      addWord = preTermDescription;
      delWord = flwTermDescription;
    } else { // redo
      addWord = flwTermDescription;
      delWord = preTermDescription;
    }

    message += '\n?????????????????? : ';
    if ( (addWord) && (delWord) ) {
      message += '"' + delWord + '"??????';
      message += '"' + addWord + '"????????????????????????';
    } else if (!(delWord)) {
      message += '"' + addWord + '"????????????????????????';
    } else if (!(addWord)) {
      message += '"' + delWord + '"????????????????????????';
    } else {
      // do nothing.
    }

    return message;
  }

  /**
  // Hstory data sample //////////////////////////////////////////
  // case1 : Color information change history data sample
  history = {
    action : "color1" or "color2",
    targetId : 000,
    previous : "black",
    following : "brown",
  };

  // case2 : Sample synonyms, preferred labels, URIs, and broader terms change history data for vocabulary tabs
  history = {
    action : "vocabulary",
    targetId : 0,
    previous : [
      {
        id : 0,
        term : "",
        preferred_label : "",
        uri : "",
        broader_term : "",
      },
    ],
    following : [
      {
        id : 0,
        term : "",
        preferred_label : "",
        uri : "",
        broader_term : "",
      },
    ],
  };

  // case3 : Term confirmation switching
  history = {
    action : "confirmChanged",
    targetId : 000,
    previous : true or false,
    following : true or false,
  };

  // case4 : Term color confirmation switching
  history = {
    action : "confirmColorChanged",
    targetId : 000,
    previous : "black",
    following : "brown",
  };

  // case5 : position move
  history = {
    action : "position",
    targetId : 000,
    previous : { position_x:0.001, position_y: 0.001 },
    following :{ position_x:0.001, position_y: 0.001 },
  };
  ///////////////////////////////////////////////////////////////////////
 */
}

const editingHistoryStore = new EditingHistory();
export default editingHistoryStore;
