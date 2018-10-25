import { Component, OnInit, ViewContainerRef, Inject } from "@angular/core";
import { ApiService } from "../../service/api/api.service";
import { NavigationComponent } from "../../components/navigation/navigation.component";
import { HeaderTextService } from "../../service/toolbar/header-text.service";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

@Component({
  selector: "sl-criteria",
  templateUrl: "./criteria.component.html",
  styleUrls: ["./criteria.component.scss"]
})
export class CriteriaComponent implements OnInit {
  evidencesSelected: string[];
  sectionsSelected: any = {};
  levelsSelected: string[];
  evidences: any[];
  sections: any[];
  levels: any;
  criteria: any;

  constructor(
    private api: ApiService,
    private navigationComponent: NavigationComponent,
    public dialog: MatDialog,
    private headerTextService: HeaderTextService
  ) {}

  testClick() {}

  submitCriteria() {
    let self = this;
    let criteria = JSON.parse(localStorage.getItem("criteria"));

    this.api
      .reqHandler("createCriteria", criteria)
      .then((result: any) => {
        if (result.status == 200) {
          // alert(result.message + "\nCriteria ID:" + result.result._id);
          this.openDialog(result.result);

          self.resetCriteria();
          self.evidencesSelected = [];
          self.sectionsSelected = [];
          self.levelsSelected = [];
        }
      })
      .catch(error => {
        console.log(error);
      });

    console.log("Criteria submitted");
  }

  pushEvidence(obj) {
    console.log(typeof obj, obj);
    this.criteria.evidences = [];
    obj.forEach(i => {
      this.criteria.evidences.push(this.evidences[i]);
    });
  }

  pushEvidenceSections(ei, obj) {
    console.log(typeof obj, ei, obj);
    this.criteria.evidences[ei].sections = [];
    obj.forEach(i => {
      this.criteria.evidences[ei].sections.push(this.sections[i]);
    });
  }

  saveCriteria() {
    this.criteria.rubric.name = this.criteria.name;
    this.criteria.rubric.description = this.criteria.description;
    this.criteria.rubric.type = this.criteria.criteriaType;

    localStorage.setItem("criteria", JSON.stringify(this.criteria));
    localStorage.setItem(
      "evidencesSelected",
      JSON.stringify(this.evidencesSelected)
    );
    localStorage.setItem(
      "sectionsSelected",
      JSON.stringify(this.sectionsSelected)
    );
    localStorage.setItem("levelsSelected", JSON.stringify(this.levelsSelected));

    // alert("Criteria Saved");
    if (confirm("Confirm Submission")) {
      this.submitCriteria();
    }
  }

  pushLevels(obj) {
    console.log(typeof obj, obj);
    this.criteria.rubric.levels = [];
    obj.forEach(i => {
      this.criteria.rubric.levels.push(this.levels[i]);
    });
  }

  ngOnInit() {
    // this.navigationComponent.headerText =
    this.headerTextService.setHeader("Criteria");

    let data = localStorage.getItem("criteria");
    if (data) {
      this.criteria = JSON.parse(data);
      this.evidencesSelected =
        JSON.parse(localStorage.getItem("evidencesSelected")) || [];
      this.sectionsSelected =
        JSON.parse(localStorage.getItem("sectionsSelected")) || {};
      this.levelsSelected =
        JSON.parse(localStorage.getItem("levelsSelected")) || [];
    } else {
      this.resetCriteria();
    }

    this.levels = [
      {
        level: "L1",
        label: "Level 1",
        description: "",
        expression: "",
        expressionVariables: []
      },
      {
        level: "L2",
        label: "Level 2",
        description: "",
        expression: "",
        expressionVariables: []
      },
      {
        level: "L3",
        label: "Level 3",
        description: "",
        expression: "",
        expressionVariables: []
      },
      {
        level: "L4",
        label: "Level 4",
        description: "",
        expression: "",
        expressionVariables: []
      }
    ];
    this.evidences = [
      {
        externalId: "BL",
        tip: "Some tip at evidence level.",
        name: "Book Look",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      {
        externalId: "LW",
        tip: "Some tip at evidence level.",
        name: "Learning Walk",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      {
        externalId: "IP",
        tip: "Some tip at evidence level.",
        name: "Interview Principal",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      {
        externalId: "CO",
        tip: "Some tip at evidence level.",
        name: "Classroom Observation",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      {
        externalId: "IT",
        tip: "Some tip at evidence level.",
        name: "Interview Teacher",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      {
        externalId: "IS",
        tip: "Some tip at evidence level.",
        name: "Interview Student",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      },
      {
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
      {
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
      {
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
      {
        externalId: "PI",
        tip: "Some tip at evidence level.",
        name: "Parent Information",
        description: "Some description about evidence",
        startTime: "",
        endTime: "",
        isSubmitted: false,
        sections: [],
        modeOfCollection: "onfield",
        canBeNotApplicable: true
      }
    ];

    this.sections = [
      { name: "Survey Questions", questions: [] },
      { name: "Data to be Filled", questions: [] },
      { name: "Group Interview", questions: [] },
      { name: "Individual Interview", questions: [] }
    ];
  }

  resetCriteria() {
    this.criteria = {
      externalId: "",
      owner: "",
      timesUsed: 12,
      weightage: 20,
      remarks: "",
      name: "",
      description: "",
      criteriaType: "auto",
      score: "",
      resourceType: ["Program", "Framework", "Criteria"],
      language: ["English"],
      keywords: ["Keyword 1", "Keyword 2"],
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
      flag: {
        label: "I have a problem with :-",
        remarks: "",
        value: "",
        options: [
          {
            value: "R1",
            label: "Criteria rating of multiple questions"
          },
          {
            value: "R2",
            label: "Criteria rating of one question only"
          }
        ]
      },
      createdFor: ["0125747659358699520", "0125748495625912324"],
      rubric: {
        levels: [
          {
            level: "L1",
            label: "Level 1",
            description: "",
            expression: "",
            expressionVariables: []
          },
          {
            level: "L2",
            label: "Level 2",
            description: "",
            expression: "",
            expressionVariables: []
          },
          {
            level: "L3",
            label: "Level 3",
            description: "",
            expression: "",
            expressionVariables: []
          },
          {
            level: "L4",
            label: "Level 4",
            description: "",
            expression: "",
            expressionVariables: []
          }
        ]
      },
      evidences: []
    };
    [
      "criteria",
      "questions",
      "evidencesSelected",
      "sectionsSelected",
      "levelsSelected"
    ].forEach(key => {
      localStorage.removeItem(key);
    });
  }

  openDialog(data): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog2, {
      width: "80%",
      height: "80%",
      data: data,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log(result);
      this.resetCriteria();
    });
  }
}

@Component({
  selector: "success-dialog",
  templateUrl: "successful-dialog.html",
  styleUrls: ["./successful-dialog.scss"]
})
export class DialogOverviewExampleDialog2 implements OnInit {
  // sections: any = [];

  ngOnInit(): void {
    // console.log(this.question, this.criteria);
  }

  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog2>,
    @Inject(MAT_DIALOG_DATA) public criteria: any
  ) {
    // console.log("oldParent--->", this.oldParent);
  }

  save(): void {
    alert("ID Copied");
    this.dialogRef.close(this.criteria);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
