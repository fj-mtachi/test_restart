/**
 * Search.js COPYRIGHT FUJITSU LIMITED 2021
 */
import React from 'react';
import PropTypes from 'prop-types';

import Grid from '@material-ui/core/Grid';
import SearchIcon from '@material-ui/icons/Search';
import Select from 'react-select'

import DialogSearchTermError from './DialogSearchTermError';

/**
 * Search text field component
 * @extends React
 */
export default class Search extends React.Component {
  /**
   * constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);
    this.init=false,
    this.errTerm='',
    this.state = {
      open: false, 
      term: '', 
      values: [],
      inputValue: '',
      selectMenuIsOpen: false,
    };
  }

  /**
   * Search error dialog open
   * @param  {string} term - search vocabulary
   */
  handleClickOpen(term) {
    this.setState({open: true, term: term});
  };

  /**
   * Search error dialog close
   */
  handleClose() {
    this.setState({open: false, term: ''});
  };

  /**
   * Search run
   * @param  {object} value - selected object
   */
   search( value) {
    if ( value === undefined){
      this.setState({values: []}); 
      return;
    }
    if ( !value || !value.value) return;
    
    const newValue = value.value;
    this.setState({values: [value]});

    this.errTerm='';
    const editingVocabulary = this.props.editingVocabulary;
    const convStr = this.hankana2Zenkana(newValue);
    let result;
    const targetFileData = editingVocabulary.getTargetFileData( editingVocabulary.selectedFile.id);
    result = targetFileData.find((node) => // Case-insensitive comparison
      node.term.toUpperCase() === convStr.toUpperCase());
    if (result) {
      editingVocabulary.deselectTermList();
      editingVocabulary.setSelectedTermList( result.term,);
      editingVocabulary.setCurrentNodeByTerm( result.term, '', null, true);
    } else {
      
        this.handleClickOpen(newValue);
    }
  }

  onKeyDown(e, newValue) {    
    if(e.type == 'keydown'){
      switch( e.keyCode){
        case 13:  // enter
          if (this.errTerm && this.errTerm.length > 0){
            this.search( {value: this.errTerm});
          }
          break;
        case 8:   // Backspace
        case 46:  // delete
          this.setState({values: [] });
          break;
      }
    }
  }  

  noOptionsMessage(obj){
    if(obj && obj.inputValue){
      this.errTerm=obj.inputValue;
      return '???'+obj.inputValue+'????????????????????????';
    }    
  }

  onInputChange(newValue, actionMeta) {
    this.errTerm=newValue;
  }

  /**
   * Half-width Katakana => Full-width Katakana conversion
   * @param  {string} str - string
   * @return {string} - conversion string
   */
  hankana2Zenkana(str) {
    const kanaMap = {
      '??????': '???', '??????': '???', '??????': '???', '??????': '???', '??????': '???',
      '??????': '???', '??????': '???', '??????': '???', '??????': '???', '??????': '???',
      '??????': '???', '??????': '???', '??????': '???', '??????': '???', '??????': '???',
      '??????': '???', '??????': '???', '??????': '???', '??????': '???', '??????': '???',
      '??????': '???', '??????': '???', '??????': '???', '??????': '???', '??????': '???',
      '??????': '???', '??????': '???', '??????': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???',
      '???': '???', '???': '???', '???': '???', '???': '???', '???': '???', '???': '???',
    };

    const reg = new RegExp('(' + Object.keys(kanaMap).join('|') + ')', 'g');
    return str
        .replace(reg, (match) => {
          return kanaMap[match];
        })
        .replace(/???/g, '???')
        .replace(/???/g, '???');
  };

  /**
   * render
   * @return {element}
   */
  render() {
    const initValue = this.state.values || [];

    const bgColors = {
      'black':'none',
      'red':'pink',
      'orange':'#FFCC99',
      'blue':'#99FFFF',
      'green':'#CCFFCC',
      'purple':'#FF66FF',
    }
    let selectData = this.props.editingVocabulary.sortedNodeList.map((d) => ({
      value: d.term,
      label: d.term,
      fontweight: d.term==this.props.editingVocabulary.currentNode.term?'bold':'default',
      color: d.confirm?'#BBBBBB':'inherit',
      bgcolor: bgColors[d.color1],
    }));
    const blankPrefix = this.props.editingVocabulary.getTermBlankPrefix();
    selectData = selectData.filter((d)=>(d.value).indexOf(blankPrefix) == -1);

    const customStyles = {
      menu: (provided) => ({
        ...provided,
        padding: '1px',
      }),
      option: (provided) => ({
        ...provided,
        padding: '5px 10px',
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        // backgroundColor:'yellow',
      }),
      control: (provided) => ({
        ...provided,
        
        width: '300px',
        height: '31px',
        minHeight: '31px',
        paddingLeft: '30px',
        border: '2px solid #444444',
        borderRadius: 0,
      }),
      valueContainer: (base) => ({
        ...base,
        marginTop: '-5px !important',
      }),
      indicatorsContainer: (base) => ({
        ...base,
        marginTop: '-5px !important',
      }),
      multiValueRemove: (base) => ({
        display:'none'
      }),
      multiValue: (base) => ({
        // ...base,
        // none css
      }),
    }
    const formatOptionLabel = ({ value, label, fontweight, color, bgcolor }) => (
      <div style={{ borderRadius:'10px', fontWeight: fontweight, color: color, backgroundColor: bgcolor, paddingLeft: '15px' }}>
          {label} 
      </div>
    );

    return (
      <div className={this.props.classes.searchRoot}>
        <Grid container>
          <Grid item xs={1}>
            <SearchIcon 
              id="select-searchIcon"
              className={this.props.classes.selectIcon}
            />
          </Grid>
          <Grid item xs={11}>
            <Select
              isClearable={true}
              placeholder="????????????????????????"
              styles={customStyles}
              options={selectData}
              formatOptionLabel={formatOptionLabel}
              isMulti
              value={initValue}
              maxMenuHeight={600}
              
              height= '20px'
              
              noOptionsMessage={(obj) =>this.noOptionsMessage(obj)}
              onChange={(newValue) =>{ this.search(newValue.slice(-1)[0]); }}
              isOptionSelected={(e) =>{ this.errTerm=''; }}
              onKeyDown={(e,newValue) =>{ this.onKeyDown(e,newValue); }}
              onInputChange={(newValue, actionMeta) =>{ this.onInputChange(newValue, actionMeta) }}
            />
          </Grid>
        </Grid>
        <DialogSearchTermError
          classes={this.props.classes}
          open={this.state.open}
          term={this.state.term}
          onClose={() => this.handleClose()}
        />
      </div>
    );
  }
}

Search.propTypes = {
  editingVocabulary: PropTypes.object,
  classes: PropTypes.object,
};
