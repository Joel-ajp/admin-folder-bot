const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { UserProfile } = require("./userProfile");
const { execSync } = require('child_process');

const USER_PROFILE = 'USER_PROFILE';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

const PARENT_CHOICES = ['Bayswater', 'BTA', 'Crestwood', 'Delek', 'Enterprise', 'Kinder Morgan', 'KINETIK', 'MARATHON', 'OXY'];
// const PARENT_CHOICES = ['Bayswater', 'BTA', 'Crestwood', 'Delek', 'Enterprise', 'Kinder Morgan', 'KINETIK', 'MARATHON', 'OXY', 'CRA', 'Drill Site Consulting', 'Energy Transfer', 'Pinnacle', 'Silverback Exploration', 'Steward',];

// This is a test function which takes two parameters. Should return a string similar to "Hello {first parameter} {second parameter}"
async function helloParams(parentProject, folderInput) {

    // Formats the parameters to be passed into the powershell script
    const formattedParam = parentProject + " " + folderInput;

    // This excecutes a command (first text encapsulated by 's) in a shell (object with key 'shell' and value 'powershell.exe')
    const execOutput = await execSync('.\\psScripts\\helloParams.ps1 ' + formattedParam, { 'shell': 'powershell.exe' }, (error, stdout, stderr) => {
        // Handles the error
        if (error != null) {
            return "There was an error with the file path";
        }

        // Handles the stderr
        if (stderr != null) {
            return "There was a stderr";
        }
    });

    // Returns the standard output
    return execOutput.toString();
}

async function fuzzyFind(parentProject, folderInput) {

    const formattedParam = parentProject + " " + folderInput.trim();

    const execOutput = await execSync('.\\psScripts\\fuzzyFind.ps1 ' + formattedParam, { 'shell': 'powershell.exe' }, (error, stdout, stderr) => {
        // Handles the error
        if (error != null) {
            return "There was an error with the file path";
        }

        // Handles the stderr
        if (stderr != null) {
            return "There was a stderr";
        }
    });

    // Returns the standard output
    return execOutput.toString();
}

// This function creates the admin folder based on the two parameters
async function createAdminFolder(parentProject, folderInput) {

    // Formats the parameters to be passed into the powershell script
    const formattedParam = parentProject + " " + folderInput.trim();

    // This excecutes a command (first text encapsulated by 's) in a shell (object with key 'shell' and value 'powershell.exe')
    const execOutput = await execSync('.\\psScripts\\paramsFolderCreation.ps1 ' + formattedParam, { 'shell': 'powershell.exe' }, (error, stdout, stderr) => {
        // Handles the error
        if (error != null) {
            return "There was an error with the file path";
        }

        // Handles the stderr
        if (stderr != null) {
            return "There was a stderr";
        }
    });

    // Returns the standard output
    return execOutput.toString();
}

class UserDialog extends ComponentDialog {
    constructor(userState) {
        super('userDialog');

        this.userProfile = userState.createProperty(USER_PROFILE);

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.parentProjectStep.bind(this),
            this.folderInputStep.bind(this),
            this.confirmationStep.bind(this),
            this.finalStep.bind(this),
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    // Run function
    async run(turnContext, accessor) {

        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    // To get the parent project
    async parentProjectStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: "Please select the parent project from the cards below: ", 
            choices: ChoiceFactory.toChoices(PARENT_CHOICES),
        });
    }

    // To get the folder to find in the parenet project
    async folderInputStep(step) {
        step.values.parentProject = step.result.value;
        return await step.prompt(TEXT_PROMPT, 'Please enter the name of the Project to create the Admin Folder in: '); 
    }

    // To get the parent project
    async confirmationStep(step) {
        const fuzzyFindOutput = await fuzzyFind(step.values.parentProject, step.result);

        step.values.folderInput = fuzzyFindOutput;

        return await step.prompt(CHOICE_PROMPT, {
            prompt: `After searching for the project: \n ${ step.values.folderInput } \n`, 
            choices: ChoiceFactory.toChoices(["Yes", "No"]),
        });
    }

    // The last step of the waterfall dialog
    async finalStep(step) {
        // Assigns the value of the folder input from the last step
        // step.values.folderInput = step.result;
        if (step.result.value === "No") {
            // Get the user state from the user profile
            const userProfile = await this.userProfile.get(step.context, new UserProfile());

            // Sets the user profile's state
            userProfile.parentProject = step.values.parentProject;
            userProfile.folderInput = step.values.folderInput;

            // Ends the dialog and returns the user state
            return await step.endDialog(userProfile);
        }


        // If the folderInputStep has a result update the user state
        if (step.result) {
            // Get the user state from the user profile
            const userProfile = await this.userProfile.get(step.context, new UserProfile());

            // Sets the user profile's state
            userProfile.parentProject = step.values.parentProject;
            userProfile.folderInput = step.values.folderInput;

            // Runs the powershell script with the parent project and folder input as parameters
            // The line below is for testing purposes only and may be uncommented to test the input of parameters 
            // const standardOut = await helloParams(userProfile.parentProject, userProfile.folderInput);

            const standardOut = await createAdminFolder(userProfile.parentProject, userProfile.folderInput);
            await step.context.sendActivity(standardOut);

            // Return the user state while ending the user dialog 
            return await step.endDialog(userProfile);
        }
    }
}

module.exports.UserDialog = UserDialog;
