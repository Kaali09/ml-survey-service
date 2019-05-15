const csv = require("csvtojson");
const FileStream = require(ROOT_PATH + "/generics/fileStream");

module.exports = class Criteria extends Abstract {
  /**
   * @apiDefine errorBody
   * @apiError {String} status 4XX,5XX
   * @apiError {String} message Error
   */

  /**
     * @apiDefine successBody
     *  @apiSuccess {String} status 200
     * @apiSuccess {String} result Data
     */

  constructor() {
    super(criteriaSchema);
  }

  static get name() {
    return "criteria";
  }

  /**
  * @api {post} /assessment/api/v1/criterias/insert Add Criterias
  * @apiVersion 0.0.1
  * @apiName Add Criterias
  * @apiGroup criterias
  * @apiParamExample {json} Request-Body:
* {
  "externalId": "",
*  "owner": "",
*  "timesUsed": "",
*  "weightage": "",
*  "remarks": "",
*  "name": "",
*  "description": "",
*  "criteriaType": "",
*  "score": "",
*  "resourceType": [
*    "Program",
*    "Framework",
*    "Criteria"
*  ],
*  "language": [
*    "English"
*  ],
*  "keywords": [
*    "Keyword 1",
*    "Keyword 2"
*  ],
*  "concepts": [
*    {
*      "identifier": "",
*      "name": "",
*      "objectType": "",
*      "relation": "",
*      "description": ,
*      "index": "",
*      "status": "",
*      "depth": "",
*      "mimeType": "",
*      "visibility": "",
*      "compatibilityLevel":"" 
*    },
*    {
*      "identifier": "",
*      "name": "",
*      "objectType": "",
*      "relation": "",
*      "description": "",
*      "index": "",
*      "status": "",
*      "depth": "",
*      "mimeType": "",
*      "visibility": "",
*      "compatibilityLevel": ""
*    }
*  ],
*  "flag": "",
*  "createdFor": [
*    "",
*    ""
*  ],
*  "rubric": {
*    "levels": [
*      {
*        "level": "L1",
*        "label": "Level 1",
*        "description": "",
*        "expression": "",
*        "expressionVariables": []
*      },
*      {
*        "level": "L2",
*        "label": "Level 2",
*        "description": "",
*        "expression": "",
*        "expressionVariables": []
*      },
*      {
*        "level": "L3",
*        "label": "Level 3",
*        "description": "",
*        "expression": "",
*        "expressionVariables": []
*      },
*      {
*        "level": "L4",
*        "label": "Level 4",
*        "description": "",
*        "expression": "",
*        "expressionVariables": []
*      }
*    ]
*  },
*  "evidences": []
* }
* @apiUse successBody
* @apiUse errorBody
  */

  insert(req) {

    return new Promise(async (resolve, reject) => {

      try {

        let result = {}
        let criteria = req.body
        criteria.owner = req.userDetails.id;

        let rubricStructure = {
          name: criteria.rubric.name,
          description: criteria.rubric.description,
          type: criteria.rubric.type,
          levels: {}
        }

        criteria.rubric.levels.forEach((levelELement) => {
          delete levelELement.expressionVariables
          rubricStructure.levels[levelELement.level] = levelELement
        })

        criteria.rubric = rubricStructure
        let generatedCriteriaDocument = await database.models.criterias.create(
          criteria
        );

        result._id = generatedCriteriaDocument._id


        let responseMessage = "Criteria added successfully."

        let response = { message: responseMessage, result: result };

        return resolve(response);
      } catch (error) {
        return reject({ message: error });
      }

    })
  }


  find(req) {
    return super.find(req);
  }

  async getEvidence(req) {
    let criteria = await this.getCriterias(req);
    // log.debug(criteria);
    // return criteria;
    return new Promise(async function (resolve, reject) {
      let merged = {},
        query = [],
        sectionData = {};

      await criteria.forEach(function (value, i) {
        query.push({ _id: ObjectId(value) });
      });

      let criterias = await database.models.criterias.find({ $or: query });
      // log.debug(criterias);
      // if (Array.isArray(criterias)) {

      await _.forEachRight(criterias, async function (crit, i) {
        await crit.evidences.forEach(async function (evidence, i) {
          if (!merged[evidence.externalId]) {
            merged[evidence.externalId] = evidence;
          } else {
            log.debug("Already Done");
            merged[evidence.externalId] = Object.assign(
              merged[evidence.externalId],
              evidence
            );
            await _.forEachRight(evidence.sections, (section, i2) => {
              _.forEachRight(
                merged[evidence.externalId].sections,
                (Msection, mi2) => {
                  log.debug(
                    merged[evidence.externalId].sections.length,
                    evidence.sections.length
                  );
                  if (Msection.name == section.name) {
                    log.debug(
                      Msection.name,
                      "-----matched------>",
                      section.name
                    );
                    // log.debug(
                    //   merged[evidence.externalId].sections[mi2],
                    //   section
                    // );

                    merged[evidence.externalId].sections[mi2].questions.concat(
                      section.questions
                    );
                    log.debug(
                      evidence.externalId,
                      "######################################333",
                      merged[evidence.externalId].sections[mi2].questions,
                      "######################################",
                      section.questions
                    );
                  } else {
                    log.debug(
                      Msection.name,
                      "-----not matched------>",
                      section.name
                    );
                  }
                }
              );
            });
          }
        });
      });
      // }

      return resolve(Object.values(merged));
    });
  }

  /**
* @api {get} /assessment/api/v1/criterias/getCriteriasParentQuesAndInstParentQues/ Get Criterias Parent Ques And instanceParentQuestionId Ques
* @apiVersion 0.0.1
* @apiName Get Criterias Parent Ques And Instance Parent Ques
* @apiGroup criterias
* @apiHeader {String} X-authenticated-user-token Authenticity token
* @apiUse successBody
* @apiUse errorBody
*/

  async getCriteriasParentQuesAndInstParentQues(req) {
    return new Promise(async function (resolve, reject) {

      let criteriaQueryResult = await database.models.criterias.find({});

      const questionQueryObject = {
        //responseType: "matrix"
      }
      let questionQueryResult = await database.models[
        "questions"
      ].find(questionQueryObject);

      let result = {
        criteria: new Array(),
        questions: new Array(),
        instanceParentQuestions: new Array()
      }

      questionQueryResult.forEach(question => {
        if (question.responseType == "matrix") {
          result.instanceParentQuestions.push({
            _id: question._id,
            externalId: question.externalId,
            name: question.question[0]
          })
        } else {
          result.questions.push({
            _id: question._id,
            externalId: question.externalId,
            name: question.question[0]
          })
        }
      })

      criteriaQueryResult.forEach(criteria => {
        result.criteria.push({
          _id: criteria._id,
          externalId: criteria.externalId,
          name: criteria.name
        })
      })

      let responseMessage = "Fetched requested data successfully."

      let response = { message: responseMessage, result: result };
      return resolve(response);

    }).catch(error => {
      reject(error);
    });
  }

  /**
  * @api {post} /assessment/api/v1/criterias/addQuestion Add Criteria Question
  * @apiVersion 0.0.1
  * @apiName Add Criteria Question
  * @apiGroup criterias
  * @apiParamExample {json} Request-Body:
  * {
  * "question": [],
  * "externalId": "",
  * "parentId": "",
  * "instanceParentId": "",
  * "visibleIf": [{"operator": "===", "value": "R1"}],
  * "file": {
  *	"required": true, 
  *	"type": ["JPEG"], 
  *	"minCount": Number, 
  *	"maxCount": Number, 
  *	"caption": Boolean
  * },
  * "responseType": "",
  * "validation": {
  *  "required": Boolean
  * },
  * "children": [],
  * "fileName": [],
  * "showRemarks": Boolean,
  * "isCompleted": Boolean,
  * "remarks": "",
  * "value": "",
  * "canBeNotApplicable": Boolean,
  * "notApplicable": "",
  * "usedForScoring": "",
  * "modeOfCollection": "",
  * "questionType": "",
  * "questionGroup": [
  *  "A1"
  * ],
  * "accessibility": "",
  * "payload": {
  *	"criteriaId": "",
  *	"evidenceId": "",
  *	"section": ""
  * }
* }
* @apiUse successBody
* @apiUse errorBody
  */

  addQuestion(req) {

    req.evidenceObjects = this.getEvidenceObjects()

    return new Promise(async (resolve, reject) => {

      try {

        let result = {}

        let question = req.body
        let questionCriteriaId = question.payload.criteriaId
        let questionEvidenceMethod = question.payload.evidenceId
        let questionSection = question.payload.section

        delete question.payload

        let criterias = await database.models.criterias.find({
          externalId: questionCriteriaId
        });

        let questionCriteria
        if (criterias[0].externalId != "") {
          questionCriteria = criterias[0]
        } else {
          throw "No criteria with ID " + questionCriteriaId + " found"
        }

        let questionCollection = {}
        let toFetchQuestionIds = new Array  
        toFetchQuestionIds.push(question.externalId)
        if (question.parentId != "") { toFetchQuestionIds.push(question.parentId) }
        if (question.instanceParentId != "") { toFetchQuestionIds.push(question.instanceParentId) }

        let questionsFromDatabase = await database.models.questions.find({
          externalId: { $in: toFetchQuestionIds }
        });

        if (questionsFromDatabase.length > 0) {
          questionsFromDatabase.forEach(question => {
            questionCollection[question.externalId] = question
          })
        }

        if (questionCollection[question.externalId]) {
          throw "The question with the external ID " + question.externalId + " already exists"
        }

        if (question.parentId != "" && !questionCollection[question.parentId]) {
          throw "Parent question with external ID " + question.parentId + " not found"
        }

        if (question.instanceParentId != "" && !questionCollection[question.instanceParentId]) {
          throw "Instance Parent question with external ID " + question.instanceParentId + " not found"
        }

        if (Object.keys(question.visibleIf[0]).length <= 0) {
          question.visibleIf = ""
        } else {
          question.visibleIf[0]._id = questionCollection[question.parentId]._id
        }

        let generatedQuestionDocument = await database.models.questions.create(
          question
        );

        result._id = generatedQuestionDocument._id


        if (question.parentId != "") {
          let queryParentQuestionObject = {
            _id: questionCollection[question.parentId]._id
          }
          let updateParentQuestionObject = {}
          updateParentQuestionObject.$push = {
            ["children"]: generatedQuestionDocument._id
          }
          await database.models.questions.findOneAndUpdate(
            queryParentQuestionObject,
            updateParentQuestionObject
          )
        }

        if (question.instanceParentId != "") {
          let queryInstanceParentQuestionObject = {
            _id: questionCollection[question.instanceParentId]._id
          }
          let updateInstanceParentQuestionObject = {}
          updateInstanceParentQuestionObject.$push = {
            ["instanceQuestions"]: generatedQuestionDocument._id
          }
          await database.models.questions.findOneAndUpdate(
            queryInstanceParentQuestionObject,
            updateInstanceParentQuestionObject
          )
        }

        let criteriaEvidences = questionCriteria.evidences
        let indexOfEvidenceMethodInCriteria = criteriaEvidences.findIndex(evidence => evidence.externalId === questionEvidenceMethod);

        if (indexOfEvidenceMethodInCriteria < 0) {
          criteriaEvidences.push(req.evidenceObjects[questionEvidenceMethod])
          indexOfEvidenceMethodInCriteria = criteriaEvidences.length - 1
        }

        let indexOfSectionInEvidenceMethod = criteriaEvidences[indexOfEvidenceMethodInCriteria].sections.findIndex(section => section.name === questionSection)
        if (indexOfSectionInEvidenceMethod < 0) {
          criteriaEvidences[indexOfEvidenceMethodInCriteria].sections.push({ name: questionSection, questions: new Array })
          indexOfSectionInEvidenceMethod = criteriaEvidences[indexOfEvidenceMethodInCriteria].sections.length - 1
        }

        criteriaEvidences[indexOfEvidenceMethodInCriteria].sections[indexOfSectionInEvidenceMethod].questions.push(generatedQuestionDocument._id)

        let queryCriteriaObject = {
          _id: questionCriteria._id
        }
        let updateCriteriaObject = {}
        updateCriteriaObject.$set = {
          ["evidences"]: criteriaEvidences
        }
        await database.models.criterias.findOneAndUpdate(
          queryCriteriaObject,
          updateCriteriaObject
        )

        let responseMessage = "Question added successfully."

        let response = { message: responseMessage, result: result };

        return resolve(response);
      } catch (error) {
        return reject({ message: error });
      }

    })
  }

  uploadQuestion(req){

    return new Promise(async (resolve,reject)=>{
      try{

        if (!req.files || !req.files.questions) {
          let responseMessage = "Bad request.";
          return resolve({ status: 400, message: responseMessage })
        }

        let questionData = await csv().fromString(req.files.questions.data.toString());
        
        let criteriaIds = new Array
        let criteriaObject = {}

        let questionCollection = {}
        let questionIds = new Array
        
        let evaluationFrameWorkDocument = await database.models.evaluationFrameworks.findOne({ externalId: questionData[0]["evaluationFrameworkId"] },{"evidenceMethods":1,"sections":1,"themes":1}).lean();
        let criteriasIdArray = gen.utils.getCriteriaIds(evaluationFrameWorkDocument.themes);
        let criteriasArray = new Array;

        criteriasIdArray.forEach(eachCriteriaIdArray=>{
          criteriasArray.push(eachCriteriaIdArray._id.toString())
        })

        questionData.forEach(eachQuestionData=>{

          let parsedQuestion = gen.utils.valueParser(eachQuestionData)

          if(!criteriaIds.includes(parsedQuestion["criteriaExternalId"])){
            criteriaIds.push(parsedQuestion["criteriaExternalId"])
          }

          if(!questionIds.includes(parsedQuestion["externalId"])) questionIds.push(parsedQuestion["externalId"])
          
          if (parsedQuestion["hasAParentQuestion"] !== "NO" && !questionIds.includes(parsedQuestion["parentQuestionId"])) { 
            questionIds.push(parsedQuestion["parentQuestionId"]) 
          }

          if (parsedQuestion["instanceParentQuestionId"] !== "NA" && !questionIds.includes(parsedQuestion["instanceParentQuestionId"])) { 
            questionIds.push(parsedQuestion["instanceParentQuestionId"]) 
          }
        })
       
        let criteriaDocument = await database.models.criterias.find({
          externalId:{$in:criteriaIds}
        }).lean()

        if(!criteriaDocument.length>0){
          throw "Criteria is not found"
        }

        criteriaDocument.forEach(eachCriteriaDocument=>{
          if(criteriasArray.includes(eachCriteriaDocument._id.toString())){
            criteriaObject[eachCriteriaDocument.externalId]= eachCriteriaDocument
          }
        })

        let questionsFromDatabase = await database.models.questions.find({
          externalId: { $in: questionIds }
        }).lean();

        if (questionsFromDatabase.length > 0) {
          questionsFromDatabase.forEach(question => {
            questionCollection[question.externalId] = question
          })
        }

        const fileName = `upload question`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        }());

        let pendingItems = new Array

        for(let pointerToQuestionData = 0;pointerToQuestionData<questionData.length;pointerToQuestionData++){
          
          let parsedQuestion = gen.utils.valueParser(questionData[pointerToQuestionData])

          let criteria = {}
          let ecm = {}

          ecm[parsedQuestion["evidenceMethod"]] = evaluationFrameWorkDocument.evidenceMethods[parsedQuestion["evidenceMethod"]]
          criteria[parsedQuestion.criteriaExternalId] = criteriaObject[parsedQuestion.criteriaExternalId]

          let section = evaluationFrameWorkDocument.sections[parsedQuestion.section]

          if ((parsedQuestion["hasAParentQuestion"] == "YES" && !questionCollection[parsedQuestion["parentQuestionId"]]) || (parsedQuestion["instanceParentQuestionId"] !== "NA" && !questionCollection[parsedQuestion["instanceParentQuestionId"]])) {
            
            pendingItems.push({
              parsedQuestion:parsedQuestion,
              criteriaToBeSent:criteria,
              evaluationFrameworkMethod:ecm,
              section:section
            })
            
          } else {

            let question = {}

            if(questionCollection[parsedQuestion["externalId"]]) {
              question[parsedQuestion["externalId"]] = questionCollection[parsedQuestion["externalId"]]
            }

            if(parsedQuestion["instanceParentQuestionId"] !== "NA" && questionCollection[parsedQuestion["instanceParentQuestionId"]]){
              question[parsedQuestion["instanceParentQuestionId"]] =  questionCollection[parsedQuestion["instanceParentQuestionId"]]
            }
            
            if(parsedQuestion["hasAParentQuestion"] == "YES" && questionCollection[parsedQuestion["parentQuestionId"]]){
              question[parsedQuestion["parentQuestionId"]] =  questionCollection[parsedQuestion["parentQuestionId"]]
            }

            let resultFromCreateQuestions = await this.createQuestions(parsedQuestion,question,criteria,ecm,section)
            
            if(resultFromCreateQuestions.result){
              questionCollection[resultFromCreateQuestions.result.externalId] = resultFromCreateQuestions.result
            }
            input.push(resultFromCreateQuestions.total[0])
          }
        }

        if(pendingItems){

          for(let pointerToPendingData = 0;pointerToPendingData<pendingItems.length;pointerToPendingData++){
            let question = {}
            let eachPendingItem = gen.utils.valueParser(pendingItems[pointerToPendingData])
            
            if(questionCollection[eachPendingItem.parsedQuestion["externalId"]]) {
              question[eachPendingItem.parsedQuestion["externalId"]] = questionCollection[eachPendingItem.parsedQuestion["externalId"]]
            }

            if(eachPendingItem.parsedQuestion["instanceParentQuestionId"] !== "NA" && questionCollection[eachPendingItem.parsedQuestion["instanceParentQuestionId"]]){
              question[eachPendingItem.parsedQuestion["instanceParentQuestionId"]] =  questionCollection[eachPendingItem.parsedQuestion["instanceParentQuestionId"]]
            }
            
            if(eachPendingItem.parsedQuestion["hasAParentQuestion"] == "YES" && questionCollection[eachPendingItem.parsedQuestion["parentQuestionId"]]){
              question[eachPendingItem.parsedQuestion["parentQuestionId"]] =  questionCollection[eachPendingItem.parsedQuestion["parentQuestionId"]]
            }
            let csvQuestionData = await this.createQuestions(eachPendingItem.parsedQuestion,question,eachPendingItem.criteriaToBeSent,eachPendingItem.evaluationFrameworkMethod,eachPendingItem.section)
            
            input.push(csvQuestionData.total[0])
          }
        }
        
        input.push(null)

      }catch(error){
        reject({
          message:error
        })
      }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

    })
  }

  getEvidenceObjectsForDCPCR() {
    return {

      "BL": {
        externalId: "BL",
        tip: "Some tip at evidence level.",
        name: "Book Look",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "LW": {
        externalId: "LW",
        tip: "Some tip at evidence level.",
        name: "Learning Walk",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "PI": {
        externalId: "PI",
        tip: "Some tip at evidence level.",
        name: "Principal Interview",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "CO": {
        externalId: "CO",
        tip: "Some tip at evidence level.",
        name: "Classroom Observation",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "TI": {
        externalId: "TI",
        tip: "Some tip at evidence level.",
        name: "Teacher Interview",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "SI": {
        externalId: "SI",
        tip: "Some tip at evidence level.",
        name: "Student Interview",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "AC3": {
        externalId: "AC3",
        tip: "Some tip at evidence level.",
        name: "Assessment- Class 3",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      "AC5": {
        externalId: "AC5",
        tip: "Some tip at evidence level.",
        name: "Assessment- Class 5",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      "AC8": {
        externalId: "AC8",
        tip: "Some tip at evidence level.",
        name: "Assessment- Class 8",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      "PAI": {
        externalId: "PAI",
        tip: "Some tip at evidence level.",
        name: "Parent Interview",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "oncall",
        canBeNotApplicable: false
      }
    }
  }

  getEvidenceObjects() {
    return {

      "DA": {
        externalId: "DA",
        tip: "Give the school leader the list of documents to be kept ready, and once they are given - begin the analysis",
        name: "Documentary Analysis",
        description: "Give the school leader the list of documents to be kept ready, and once they are given - begin the analysis",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "SW": {
        externalId: "SW",
        tip: "Conduct a school walkthrough first and then enter the data",
        name: "School Walkthrough (Observations)",
        description: "Conduct a school walkthrough first and then enter the data",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "PI": {
        externalId: "PI",
        tip: "Conduct principal interview on the first or second day, before the coordinator interview",
        name: "Principal Interview",
        description: "Conduct principal interview on the first or second day, before the coordinator interview",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "CO": {
        externalId: "CO",
        tip: "Conduct 3 pop-in observations of 10 minutes each for all teachers",
        name: "Classroom Observation",
        description: "Conduct 3 pop-in observations of 10 minutes each for all teachers",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "TI": {
        externalId: "TI",
        tip: "Conduct teacher interviews for 25% of teachers across sections or 10 teachers, whichever is greater",
        name: "Teacher Interview",
        description: "Conduct teacher interviews for 25% of teachers across sections or 10 teachers, whichever is greater",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "AC3": {
        externalId: "AC3",
        tip: "",
        name: "Assessment Class 3",
        description: "",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      "AC5": {
        externalId: "AC5",
        tip: "",
        name: "Assessment Class 5",
        description: "",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      "AC8": {
        externalId: "AC8",
        tip: "",
        name: "Assessment Class 8",
        description: "",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      "PAI": {
        externalId: "PAI",
        tip: "Approach parents when they are dropping children to the school or are waiting to pick children up from the school. Ask the following questions for 7-8 parents",
        name: "Parent Interview",
        description: "Approach parents when they are dropping children to the school or are waiting to pick children up from the school. Ask the following questions for 7-8 parents",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "COI": {
        externalId: "COI",
        tip: "Conduct coordinator interview on the second or third day, after the principal interview",
        name: "Coordinator Interview",
        description: "Conduct coordinator interview on the second or third day, after the principal interview",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "SFGD": {
        externalId: "SFGD",
        tip: "1 group (7-8 students from 4th and 5th)",
        name: "Student Focused Group Discussions",
        description: "1 group (7-8 students from 4th and 5th)",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      },
      "TFGD": {
        externalId: "TFGD",
        tip: "3 (primary, middle, high)",
        name: "Teacher Focused Group Discussions",
        description: "3 (primary, middle, high)",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: false
      }
    }
  }

  async uploadRubricLevels(req) {

    return new Promise(async (resolve, reject) => {

      try {
        let criteriaData = await csv().fromString(req.files.criteria.data.toString());

        let programQueryList = {}
        let programId = ""
        criteriaData.forEach(criteria => {
          programId = criteria.programId
          programQueryList[criteria.programId] = criteria.programId
        });

        let programsFromDatabase = await database.models.programs.find(
          { externalId: { $in: Object.values(programQueryList) } },
          { name: 1, components: 1, externalId: 1 }
        );

        const programsData = programsFromDatabase.reduce(
          (ac, program) => ({ ...ac, [program.externalId]: program }), {})

        criteriaData = await Promise.all(criteriaData.map(async (criteria) => {

          let criteriaQueryObject = {
            externalId: criteria.externalId
          }

          const existingCriteria = await database.models.criterias.findOne(
            criteriaQueryObject,
            { name: 1, description: 1, criteriaType: 1, rubric: 1 }
          )

          if (!existingCriteria) {
            return
          }

          let expressionVariables = {}
          let expressionVariablesArray = criteria.expressionVariables.split(",")
          expressionVariablesArray.forEach(expressionVariable => {
            let expressionVariableArray = expressionVariable.split("=");
            let defaultVariableArray = expressionVariableArray[0].split("-")
            if(defaultVariableArray.length>1){
              if(!expressionVariables.default) expressionVariables.default = {};
              expressionVariables.default[defaultVariableArray[0]] = expressionVariableArray[1]
            }else{
              expressionVariables[expressionVariableArray[0]] = expressionVariableArray[1]
            }
          })
          let rubric = {
            name: existingCriteria.name,
            description: existingCriteria.description,
            type: existingCriteria.criteriaType,
            expressionVariables: expressionVariables,
            levels: {}
          }

          let existingCriteriaRubricLevels

          if (Array.isArray(existingCriteria.rubric.levels)) {
            existingCriteriaRubricLevels = existingCriteria.rubric.levels
          } else {
            existingCriteriaRubricLevels = Object.values(existingCriteria.rubric.levels)
          }

          existingCriteriaRubricLevels.forEach(levelObject => {
            rubric.levels[levelObject.level] = {
              level: levelObject.level,
              label: levelObject.label,
              description: levelObject.description,
              expression: criteria[levelObject.level]
            }
          })

          let updateObject = {}

          let queryOptions = {
            queryOptions: true
          }

          updateObject.$set = {
            rubric: rubric
          }

          criteria = await database.models.criterias.findOneAndUpdate(
            criteriaQueryObject,
            updateObject,
            queryOptions
          );

          return criteria


        }));


        if (criteriaData.findIndex(criteria => criteria === undefined) >= 0) {
          throw "Something went wrong, not all records were inserted/updated."
        }

        let submissionDocumentCriterias = [];

        for (
          let counter = 0;
          counter < programsData[programId].components.length;
          counter++
        ) {
          let component = programsData[programId].components[counter];

          let evaluationFrameworkQueryObject = [
            { $match: { _id: ObjectId(component.id) } },
            {
              $project: { themes: 1, name: 1, description: 1, externalId: 1, questionSequenceByEcm: 1 }
            }
          ];

          let evaluationFrameworkDocument = await database.models[
            "evaluationFrameworks"
          ].aggregate(evaluationFrameworkQueryObject);

          let criteriasId = new Array
          let criteriaObject = {}
          let criteriasIdArray = gen.utils.getCriteriaIdsAndWeightage(evaluationFrameworkDocument[0].themes);

          criteriasIdArray.forEach(eachCriteriaId=>{
            criteriasId.push(eachCriteriaId.criteriaId)
            criteriaObject[eachCriteriaId.criteriaId.toString()]={
              weightage:eachCriteriaId.weightage
            }
          })

          let criteriaQuestionDocument = await database.models.criteriaQuestions.find({ _id: { $in: criteriasId } })

          criteriaQuestionDocument.forEach(criteria => {
            criteria.weightage = criteriaObject[criteria._id.toString()].weightage
            submissionDocumentCriterias.push(
              _.omit(criteria._doc, [
                "resourceType",
                "language",
                "keywords",
                "concepts",
                "createdFor",
                "evidences"
              ])
            );
          });
        }

        let updatedCriteriasObject = {}

        updatedCriteriasObject.$set = {
          criterias: submissionDocumentCriterias
        }

        let updateSubmissions = await database.models.submissions.updateMany(
          { programId: programsData[programId]._id },
          updatedCriteriasObject
        );

        let responseMessage = "Criteria rubric updated successfully."

        let response = { message: responseMessage };

        return resolve(response);

      } catch (error) {
        return reject({
          status: 500,
          message: error,
          errorObject: error
        });
      }

    })
  }

  async uploadCriterias(req) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!req.files || !req.files.criterias) {
          throw "Csv file for criterias should be selected"
        }

        let criteriaData = await csv().fromString(req.files.criterias.data.toString())

        const fileName = `upload Criteria`;
        let fileStream = new FileStream(fileName);
        let input = fileStream.initStream();

        (async function () {
          await fileStream.getProcessorPromise();
          return resolve({
            isResponseAStream: true,
            fileNameWithPath: fileStream.fileNameWithPath()
          });
        }());


        await Promise.all(criteriaData.map(async criteria => {

          let csvData = {}
          let rubric = {}
          let parsedCriteria = gen.utils.valueParser(criteria)

          rubric.name = parsedCriteria.criteriaName
          rubric.description = parsedCriteria.criteriaName
          rubric.type = parsedCriteria.type
          rubric.expressionVariables = {}
          rubric.levels = {};
          let countLabel = 1;

          Object.keys(parsedCriteria).forEach(eachCriteriaKey => {

            let regExpForLevels = /^L+[0-9]/
            if (regExpForLevels.test(eachCriteriaKey)) {

              let label = "Level " + countLabel++;

              rubric.levels[eachCriteriaKey] = {
                level: eachCriteriaKey,
                label: label,
                description: parsedCriteria[eachCriteriaKey],
                expression: ""
              }
            }
          })

          let criteriaStructure = {
            owner: req.userDetails.id,
            name: parsedCriteria.criteriaName,
            description: parsedCriteria.criteriaName,
            resourceType: [
              "Program",
              "Framework",
              "Criteria"
            ],
            language: [
              "English"
            ],
            keywords: [
              "Keyword 1",
              "Keyword 2"
            ],
            concepts: [
              {
                identifier: "LPD20100",
                name: "Teacher_Performance",
                objectType: "Concept",
                relation: "associatedTo",
                description: null,
                index: null,
                status: null,
                depth: null,
                mimeType: null,
                visibility: null,
                compatibilityLevel: null
              },
              {
                identifier: "LPD20400",
                name: "Instructional_Programme",
                objectType: "Concept",
                relation: "associatedTo",
                description: null,
                index: null,
                status: null,
                depth: null,
                mimeType: null,
                visibility: null,
                compatibilityLevel: null
              },
              {
                identifier: "LPD20200",
                name: "Teacher_Empowerment",
                objectType: "Concept",
                relation: "associatedTo",
                description: null,
                index: null,
                status: null,
                depth: null,
                mimeType: null,
                visibility: null,
                compatibilityLevel: null
              }
            ],
            createdFor: [
              "0125747659358699520",
              "0125748495625912324"
            ],
            evidences: [],
            deleted: false,
            externalId: criteria.criteriaID,
            owner: req.userDetails.id,
            timesUsed: 12,
            weightage: 20,
            remarks: "",
            name: parsedCriteria.criteriaName,
            description: parsedCriteria.criteriaName,
            criteriaType: "auto",
            score: "",
            flag: "",
            rubric: rubric
          };

          let criteriaDocuments = await database.models.criterias.create(
            criteriaStructure
          );

          csvData["Criteria Name"] = parsedCriteria.criteriaName
          csvData["Criteria External Id"] = parsedCriteria.criteriaID

          if(criteriaDocuments._id){
          csvData["Criteria Internal Id"] = criteriaDocuments._id            
          } else{
            csvData["Criteria Internal Id"] = "Not inserted" 
          }

          input.push(csvData)
        }))

        input.push(null)

      }
      catch (error) {
        return reject({
          status: 500,
          message: error,
          errorObject: error
        });
      }
    })
  }

  async createQuestions(parsedQuestion,questionCollection,criteriaObject,evidenceCollectionMethodObject,questionSection){

    let csvArray = new Array

    return new Promise(async(resolve,reject)=>{

        let includeFieldByDefault = {
          "remarks" : "",
          "value" : "",
          "usedForScoring" : "",
          "questionType" : "auto",
          "deleted" : false,
          "canBeNotApplicable" : "false"
        }
        
        let resultQuestion

        let csvResult = {}
        
        if (questionCollection && questionCollection[parsedQuestion["externalId"]]) {
          csvResult["internal id"] = "Question already exists"
        } else{
    
          let allValues = {}

          Object.keys(includeFieldByDefault).forEach(eachFieldToBeIncluded=>{
            allValues[eachFieldToBeIncluded] = includeFieldByDefault[eachFieldToBeIncluded]
          })

          allValues["visibleIf"]= new Array
          allValues["question"] = new Array

          let evidenceMethod = parsedQuestion["evidenceMethod"]

          if(parsedQuestion["hasAParentQuestion"] !== "YES"){
            allValues.visibleIf = ""
          }else{

            let operator = parsedQuestion["parentQuestionOperator"]="EQUALS"?parsedQuestion["parentQuestionOperator"] = "===":parsedQuestion["parentQuestionOperator"]
            
            allValues.visibleIf.push({
              operator:operator,
              value:parsedQuestion.parentQuestionValue,
              _id:questionCollection[parsedQuestion["parentQuestionId"]]._id
            })
          }
    
          allValues.question.push(
            parsedQuestion["question0"],
            parsedQuestion["question1"])

          allValues["rubricLevel"] = parsedQuestion["rubricLevel"]?parsedQuestion["rubricLevel"]:""
          
          allValues["isAGeneralQuestion"] = Boolean(gen.utils.lowerCase(parsedQuestion["isAGeneralQuestion"]?parsedQuestion["isAGeneralQuestion"]:""))

          allValues["externalId"] = parsedQuestion["externalId"]

          if(parsedQuestion["responseType"] !== ""){
            allValues["responseType"] = parsedQuestion["responseType"]
            allValues["validation"] = {}
            allValues["validation"]["required"] = gen.utils.lowerCase(parsedQuestion["validation"])

            if(parsedQuestion["responseType"] == "matrix"){
              allValues["instanceIdentifier"] = parsedQuestion["instanceIdentifier"]
            }
            if(parsedQuestion["responseType"] == "date"){
              allValues["dateFormat"] = parsedQuestion.dateFormat
              allValues["autoCapture"] = gen.utils.lowerCase(parsedQuestion.autoCapture)
              allValues["validation"]["validationMax"] = parsedQuestion.validationMax
              allValues["validation"]["validationMin"] = parsedQuestion.validationMin?parsedQuestion.validationMin:parsedQuestion.validationMin=""
            }

            if(parsedQuestion["responseType"] == "number"){

              allValues["validation"]["IsNumber"] = gen.utils.lowerCase(parsedQuestion["validationIsNumber"])
              
              if(parsedQuestion["validationRegex"] == "IsNumber"){
                  allValues["validation"]["regex"] = "^[0-9s]*$"
              }else{
                  allValues["validation"]["regex"] = "^[A-Z]*$"
              }
              
            }

            if(parsedQuestion["responseType"] == "slider"){
               if(parsedQuestion["validationRegex"] == "IsNumber"){
                  allValues["validation"]["regex"] = "^[0-9s]*$"
                }else{
                  allValues["validation"]["regex"] = "^[A-Z]*$"
                }
              allValues["validation"]["validationMax"] = parsedQuestion.validationMax
              allValues["validation"]["validationMin"] = parsedQuestion.validationMin?parsedQuestion.validationMin:parsedQuestion.validationMin=""
            }
          }

          allValues["fileName"] = []
          allValues["file"] = {}

          if(parsedQuestion["file"] != "NA"){
        
            allValues.file["required"] = gen.utils.lowerCase(parsedQuestion["fileIsRequired"])
            allValues.file["type"] = new Array
            allValues.file.type.push(parsedQuestion["fileUploadType"])
            allValues.file["minCount"] = parsedQuestion["minFileCount"]
            allValues.file["maxCount"] = parsedQuestion["maxFileCount"]
            allValues.file["caption"] = parsedQuestion["caption"]
          }

    
          allValues["showRemarks"] = Boolean(gen.utils.lowerCase(parsedQuestion["showRemarks"]))
          allValues["tip"] = parsedQuestion["tip"]

          allValues["questionGroup"] = parsedQuestion["questionGroup"].split(',')

          allValues["modeOfCollection"] = parsedQuestion["modeOfCollection"]
          allValues["accessibility"] = parsedQuestion["accessibility"]

          allValues["options"] = new Array
          allValues["isCompleted"] = false
          allValues["value"] = ""

          for(let pointerToResponseCount=1;pointerToResponseCount<10;pointerToResponseCount++){
            let responseValue = "R"+pointerToResponseCount

            if(parsedQuestion[responseValue] && parsedQuestion[responseValue] != ""){
              allValues.options.push({
                value:responseValue,
                label:parsedQuestion[responseValue]
              })
            }
          }
    
          let createQuestion = await database.models.questions.create(
            allValues
          )

          if(!createQuestion._id){
            csvResult["internal id"] = "Not Created"
          } else{
            resultQuestion = createQuestion
            csvResult["internal id"] = createQuestion._id

            if (parsedQuestion["parentQuestionId"] != "") {

            let queryParentQuestionObject = {
              _id: questionCollection[parsedQuestion["parentQuestionId"]]._id
            }

            let updateParentQuestionObject = {}

            updateParentQuestionObject.$push = {
              ["children"]: createQuestion._id
            }

            await database.models.questions.findOneAndUpdate(
              queryParentQuestionObject,
              updateParentQuestionObject
            )
            }

            if (parsedQuestion["instanceParentQuestionId"] != "NA") {

            let queryInstanceParentQuestionObject = {
              _id: questionCollection[parsedQuestion["instanceParentQuestionId"]]._id
            }

            let updateInstanceParentQuestionObject = {}

            updateInstanceParentQuestionObject.$push = {
              ["instanceQuestions"]: createQuestion._id
            }

            await database.models.questions.findOneAndUpdate(
              queryInstanceParentQuestionObject,
              updateInstanceParentQuestionObject
            )
            }

          let newCriteria = await database.models.criterias.findOne(
            {
              _id: criteriaObject[parsedQuestion["criteriaExternalId"]]._id
            },
            {
              evidences : 1
            }
          )
          
          let criteriaEvidences = newCriteria.evidences
          let indexOfEvidenceMethodInCriteria = criteriaEvidences.findIndex(evidence => evidence.externalId === evidenceMethod);

          if (indexOfEvidenceMethodInCriteria < 0) {
            evidenceCollectionMethodObject[evidenceMethod]["sections"] = new Array
            criteriaEvidences.push(evidenceCollectionMethodObject[evidenceMethod])
            indexOfEvidenceMethodInCriteria = criteriaEvidences.length - 1
          }

          let indexOfSectionInEvidenceMethod = criteriaEvidences[indexOfEvidenceMethodInCriteria].sections.findIndex(section => section.name === questionSection)
    
          if (indexOfSectionInEvidenceMethod < 0) {
          criteriaEvidences[indexOfEvidenceMethodInCriteria].sections.push({ name: questionSection, questions: new Array })
          indexOfSectionInEvidenceMethod = criteriaEvidences[indexOfEvidenceMethodInCriteria].sections.length - 1
          }

          criteriaEvidences[indexOfEvidenceMethodInCriteria].sections[indexOfSectionInEvidenceMethod].questions.push(createQuestion._id)

          let queryCriteriaObject = {
          externalId: parsedQuestion["criteriaExternalId"]
          }

          let updateCriteriaObject = {}
          updateCriteriaObject.$set = {
            ["evidences"]: criteriaEvidences
          }

          await database.models.criterias.findOneAndUpdate(
            queryCriteriaObject,
            updateCriteriaObject
          )
          }
        }

      csvResult["Question External Id"] = parsedQuestion["externalId"]
      csvResult["Question Name"] = parsedQuestion["question0"]
      csvArray.push(csvResult)

      return resolve({
        total:csvArray,
        result:resultQuestion
      })
      
    })
  }
 
};


