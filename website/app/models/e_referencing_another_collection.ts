import { Schema, model } from "mongoose";
import { IFngSchemaDefinition } from "../../../src/fng-schema";

const eSchemaDef: IFngSchemaDefinition = {
  surname: {type: String, list: {}},
  forename: {type: String, list: true},
  weight: {type: Number, form: {label: 'Weight (lbs)'}},
  leadMentor:    { type: Schema.Types.ObjectId, ref:{type:'lookup', collection:'c_subdoc_example'}, required: true},
  mentor:    { type: Schema.Types.ObjectId, ref:{type:'lookup', collection:'c_subdoc_example'}},
  guide:     { type: Schema.Types.ObjectId, ref:{type:'lookup', collection:'b_enhanced_schema'}, form: {directive: 'fng-ui-select'}},
  teacher: { type: Schema.Types.ObjectId, ref:{type:'lookup', collection:'b_enhanced_schema'}, form: {directive: 'fng-ui-select', fngUiSelect: {fngAjax: true}}},
  dateOfBirth: Date,
  assistants : [{ type: Schema.Types.ObjectId , ref:{type:'lookup', collection:'a_unadorned_schema'}}],
  assistants2:  { type:[Schema.Types.ObjectId], ref:{type:'lookup', collection:'a_unadorned_schema'}} ,
  team : [ { type: Schema.Types.ObjectId , ref:{type:'lookup', collection:'f_nested_schema'}, form: {directive: 'fng-ui-select', fngUiSelect: {fngAjax: true}}} ],
  team2:   { type:[Schema.Types.ObjectId], ref:{type:'lookup', collection:'f_nested_schema'}, form: {directive: 'fng-ui-select', fngUiSelect: {fngAjax: true}}},
  accepted: Boolean
};

const ESchema = new Schema(eSchemaDef);

let E;
try {
  E = model('e_referencing_another_collection');
} catch (e) {
  E = model('e_referencing_another_collection', ESchema);
}

ESchema.statics.report = function (report) {
  let reportSchema: any = '';
  switch (report) {
    case 'class-sizes' :
      reportSchema = {
        pipeline: [
          {$group: {_id: '$teacher', count: {'$sum': 1}}}
        ],
        title: 'Class Sizes',
        columnDefs: [
          {field: '_id', displayName: 'Teacher'},
          {field: 'count', displayName: 'Number in Class'}
        ],
        columnTranslations: [
          {field: '_id', ref:{type:'lookup', collection:'b_enhanced_schema'}}
        ]
      };
      break;
  }
  return reportSchema;
};

ESchema.statics.form = function (layout) {
  let formSchema: any = '';
  switch (layout) {
    case 'links' :
      formSchema = {
        surname: {},
        forename: {},
        weight: {},
        mentor:{link:{linkOnly:true}},
        assistants:{link:{linkOnly:true}}
      };
      break;
  }
  return formSchema;
};

module.exports = {
  model: E
};


