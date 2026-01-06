I need to create a mobile application that helps adult children take care of their aging parents. The app must be suitable for publishing on the App Store and strictly adhere to App Store guidelines. It should feature an award-winning, modern  innovative UI with interactive and engaging (addictive but ethical) elements, while remaining extremely easy to understand and use for both the parent and the child.

For simplicity, the two users will be referred to as **Mom** (parent) and **Son** (adult child). This terminology can represent any adult parent–child relationship.

The application will support **two types of users**:

- **Parent (Mom)**
    
    An older adult who may easily forget daily activities such as taking medicine, eating meals, or completing important tasks.
    
- **Adult Child (Son)**
    
    An adult (approximately 30–50 years old) who lives separately from the parent but is responsible for monitoring, supporting, and caring for the parent remotely.
    

The app’s primary goal is to bridge the gap between Mom and Son by enabling simple communication, reminders, and emotional connection through an intuitive and visually appealing experience that works comfortably for both age groups.

For this you need to create a react native app with firebase as the backend.

Use style in this screenshots  for UI inspiration. (Don’t need to use its text, need to copy the theme and modify for our special scenario) I will provide screens our app has, but only with element placement to get rough idea)

Design inspirations

1st keep onboarding screen not implemented. Keep one screen for that so that we can implement later. First we need to implement the main business logic.

<SCREENSHOT IMAGES INSPIRATIONS>

There are few objects involving in the app.

1. User 
    - name
    - role: "parent" / "child"
    - email
    - phone
    - profileImageUrl
    - batteryPercentage
    - mood
    - lastInteraction: timestamp
2. Reminder
    - id
    - createdBy: userId (Adult Child)
    - forUser: userId (Parent)
    - title
    - description (optional)
    - dateTime
    - repeat: "daily" / "weekly" / "custom" if custom, proper way to store it
    - label: "medicine" / "meal" / "doctor"
    - status: "missed" / "ok"
    - customAlarmAudioUrl (optional)
    - followUpMinutes (optional, if not done)
3. chatRooms (collection)
- chatRoomId (doc)
    - participants: [userId1, userId2]
    - lastUpdated
    - messages (subcollection)
        - messageId (doc)
            - senderId
            - type: "text" / "image" / "voice" / "sticker" / "mood"
            - content: text or URL
            - timestamp

1. locations (collection)
    - locationId (doc)
        - userId
        - latitude
        - longitude
        - timestamp
2. Album Image (To include in album section)
    - image
    - id
    - uploaded timestamp

Common functionalities for both types of users. 

1. Register / Login
2. Delete account
3. Logout
4. Chat
5. Photo album (Both can add only photo with small note. it should be a photo wall that remembers everything when scroll from bottom to top)

Adult child only functionalities

1. Set a reminder
2. See Parent’s location
3. See Parent’s battery percentage

Parent only functionalities

1. Ring the alarm at the time
2. Allow access to battery percentage 
3. Allow access to location
4. Emergency button and on click notify the adult child.

Application flows - 

When user opens the app for first time there should be login/ sign up screen. If user choose login he can login and if register he can register. There are 2 options for now google and apple id sign in.

Once user register,

Until he choose one option, there should be 2 options he can select.

1. Adult child  mode
2. Parent mode

There is common setting page for app. There user can edit the profile and delete the account. User can select its role in settings page. There should be a way to add the other party for the user. once clicked it should ask for other party’s id. If user changed its type, other party’s connection will be removed. (He will be party with no connection)

There should be a chat and settings page for both type of users.

1. **Adult child  mode**

If the user choose  adult child mode, this He will have below screens. 

- Home, Reminders List, Chat and Settings - Use below reference to placement of the elements.

adult_child_chat.png

adult_child_home.png

adult_child_reminder.png

Screens need to be implemented (feel free to make proper design on your own)- 

- Reminder creation and update screen
- Emergency alert screen (This should be opened in the adult child side when the parent click on the emergency button)

1. **Parent mode** 

If the user choose  parent mode, He will have below screens. 

- Home, Reminders List (cannot edit or modify) , Chat and Settings - Use below reference to placement of the elements.
    
    parent_home.png
    
    parent_reminders.png
    
    parent chat is similar to adult child chat
    

Screens need to be implemented (feel free to make proper design on your own)- 

- Reminder alarm screen - There should be a ok and done  button  ( This should be opened in the parent side when the reminder rings)  Parent can select one of this button. if he click the done button the task is done, adult child will get notification its done. If the parent select ok button, alarm should ring after 10 mins again. Then user can select done or ok button. If the parent still  haven’t done the task, adult child get notification saying its not done for the second time. Parent wont be reminded again for that task again. (Adult child can make a call or get necessary actions)

User flows - 

1. Once app is opened for first time the app should ask for relevant permission. (This should not frustrate user)
2. Once the app opens for first time it should ask for the role, based on the role it should ask for the id of partner (In the same page user’s id should be displayed so that be used by other partner)  Once either user enter other users id, they should be connected and should be ready for below functionalities.
3. Adult child should be able to set reminders for parent. That should ring on parents phone at the right time.
4. Parent should be able to click Emergency button in case of emergency. The adult child should get it instantly.
5. Both should be able to chat using text with emojis, images, sending contacts , stickers, voice notes etc.
6. In the photo album, user should be able to post a image with a note. it should be displayed like attractive wall.
7. Users should be  able to change the settings.

this is the design of the application you have to create complete architecture with full readme file so that ai can understand and build. This should be a detailed plan. Once i give that readme file it should output me full fledged end to end application that can be deployed in production.  I will include image files related to this in the main folder, you can check the folder with name. You should act as a experienced full stack developer and think of all the cases can come up  then design the application document. you should include all Frontend, and database structures, design systems to have consistency, all the objects and components in the application. Ensure modularity and feature extendibility.  Before get started you can ask any question from me.

Also, remember don’t need to worry about <SCREENSHOT IMAGES INSPIRATIONS> i will add this manually into readme file created by you. (Keep a space for that) No need to include given placement screenshots (<SCREENSHOT IMAGES>)  also in the readme file generated by you. i will add them manually into readme file (but you can refer them whenever you need to get an idea) keep a placeholder for those places.