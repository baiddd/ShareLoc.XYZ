importScripts('https://rawgit.com/joewalnes/filtrex/master/filtrex.js')

class Filter {
  constructor() {
    this.default_expression = ''
  }

  async run(my){
    console.log(my)
    const expression = my.data.filter_expression || this.default_expression;
    const myfilter = compileExpression(expression)
    my.target.result = myfilter(my.target)
    return my
  }

  register(){
    return {
      name: "Filter",
      type: "localization/filter",
      tags: ["localization", "action"],
      init: "Filter the table {id:'varname', type:'variableName', variableType:'number'} with {id:'filter_expression', type:'string', placeholder:'a>10'}"
    }
  }
}

api.export(new Filter())
