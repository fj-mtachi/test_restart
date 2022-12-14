/**
 * DialogSettingSynonym.js COPYRIGHT FUJITSU LIMITED 2021
 */
import React from 'react';
import PropTypes from 'prop-types';

import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

/**
 * Select a representative word when setting synonyms dialog
 * @extends React
 */
export default class DialogSettingSynonym extends React.Component {
  /**
   * constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
    this.preferredList = [];
    this.broaderList = [];
    this.broaderClassName = this.props.classes.displayNone;
    this.state = {
      selectPreferred: '',
      selectBroader: '',
    };
  }

  /**
  * Dialog close event
  */
  handleClose() {
    
    this.crearDatas();
    this.props.onClose('cancel');
  };

  /**
  * Data crear
  */
  crearDatas(){
    this.preferredList = [];
    this.broaderList = [];
    this.broaderClassName = this.props.classes.displayNone;
    this.setState({ 
      selectPreferred: '',
      selectBroader: '',
     });
  }

  /**
   * initialization
   */
  initPreferred() {

    this.broaderClassName = this.props.classes.displayNone;

    const source = this.props.source;    
    const target = this.props.target;

    this.props.editingVocabulary.deselectTermList();
    this.props.editingVocabulary.setSelectedTermList(source.term);
    this.props.editingVocabulary.setCurrentNodeByTerm(source.term, null, null, true);
    
    let tmpSynonym = [...this.props.editingVocabulary.tmpSynonym.list, target.term];    

    this.props.editingVocabulary.updataSynonym(tmpSynonym);

    this.preferredList = [...this.props.editingVocabulary.tmpSynonym.list, source.term].filter((val, i, self)=>{
      return i === self.indexOf(val);
    });

    const blankPrefix = this.props.editingVocabulary.getTermBlankPrefix();
    this.preferredList = this.preferredList.filter((val)=>{
      return  val.indexOf(blankPrefix) == -1;
    });
    
    
    if (this.props.editingVocabulary.tmpBroaderTerm.list.length > 1) {
      
      this.broaderList=[...this.props.editingVocabulary.tmpBroaderTerm.list].filter((val, i, self)=>{
        return i === self.indexOf(val);
      });
      this.broaderClassName= this.props.classes.formControl;
    }else{
      this.setState({ 
        selectPreferred: this.props.source.term,
        selectBroader: this.props.editingVocabulary.tmpBroaderTerm.list.length > 0 ? this.props.editingVocabulary.tmpBroaderTerm.list[0] : '' 
      });   
    }
  }

  /**
   * Preferred label change event
   * @param  {object} e - information of event
   */
  changePreferred(e) {
    this.setState({ selectPreferred: e.target.value });    
  }

   /**
   * Broader label change event
   * @param  {object} e - information of event
   */
  changeBroader(e) {
    this.setState({ selectBroader: e.target.value });    
  }
  
  /**
   * Perform synonym settings 
   */
  execSetSynonym() {
    
    if ( this.state.selectPreferred === '') {
      window.alert('????????????????????????????????????');
      return;
    }
    if (this.props.editingVocabulary.tmpBroaderTerm.list.length > 1 && this.state.selectBroader === '') {
      window.alert('????????????????????????????????????');
      return;
    }
    
    this.props.editingVocabulary.updataPreferredLabel( [ this.state.selectPreferred ]);
    this.props.editingVocabulary.updataBroaderTerm( [ this.state.selectBroader ]);

    const ret = this.props.editingVocabulary.updateVocabulary();

    this.crearDatas();
    this.props.onClose( ret);
  }

  /**
   * render
   * @return {element}
   */
  render() {
    const synonymSourceTerm=this.props.source?(this.props.source.term?this.props.source.term:''):'';
    const synonymTargetTerm=this.props.target?(this.props.target.term?this.props.target.term:''):'';
    const title = '???'+synonymSourceTerm+'?????????????????? ???'+synonymTargetTerm+'????????????????????????';
    const brankPreferred = this.broaderList.length > 1 ? true : false;
    
    return (
      <div>
        <Dialog
          onClose={() => this.handleClose()}
          open={this.props.open}
          onEntered={() => this.initPreferred()}
        >
          <DialogTitle>
            {title}
            <IconButton
              aria-label="close"
              onClick={() => this.handleClose()}
              className={this.props.classes.closeButton}
            >
              <CloseIcon />            
            </IconButton>
          </DialogTitle>

          <DialogContent style={{width: '420px',overflow: 'hidden'}}  dividers>
            <Box component="div" display="block" >

              <FormControl
                variant="outlined"
                className={this.props.classes.formControl}
              >
                <span>
                ????????????????????????????????????????????????<br />????????????1????????????????????????????????????
                </span>
                <Select
                  native
                  id='preferred'
                  value={this.state.selectPreferred}
                  onChange={(e) => this.changePreferred(e)}
                  className={this.props.classes.selectSynonymDialog}
                >
                  { brankPreferred &&
                    <option key={-1} value=''>????????????????????????????????????</option>
                  }
                  {this.preferredList.map((item, i) => (
                    <option key={i} value={item}>{item}</option>
                  ))}
                </Select>

              </FormControl>
              <FormControl
                variant="outlined"
                className={ this.broaderClassName}
              >
              <span>
                <br />
                ????????????????????????????????????????????????<br />????????????1????????????????????????????????????
              </span>
                <Select
                  native
                  id='broader'
                  value={this.state.selectBroader}
                  onChange={(e) => this.changeBroader(e)}
                  className={this.props.classes.selectSynonymDialog}                    
                >
                    <option key={-1} value=''>????????????????????????????????????</option>
                  {this.broaderList.map((item, i) => (
                    <option key={i} value={item}>{item}</option>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.execSetSynonym()} color="primary">
            OK
            </Button>
            <Button onClick={() => this.handleClose()} color="primary">
            Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

DialogSettingSynonym.propTypes = {
  onClose: PropTypes.func,  
  open: PropTypes.bool,
  classes: PropTypes.object,
  editingVocabulary: PropTypes.object, 
  source: PropTypes.object,
  target: PropTypes.object,
};
