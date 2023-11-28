const { ActivityHandler } = require('botbuilder');

class DialogBot extends ActivityHandler {
     /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog) {
        super();
        // Check for parameters
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        // Set the state
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        // Instatiation for new users
        this.onMembersAdded(async (context, next) => {
            // Introduction mesesage for new users
            await context.sendActivity('Chat to begin admin folder creation.');
        });

        // Runs the dialog with the conversation context and the dialog state
        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');
            await this.dialog.run(context, this.dialogState);

            await next();
        });
    }

}

module.exports.DialogBot = DialogBot;