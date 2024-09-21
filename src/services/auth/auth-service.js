const {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    db,
    admin,
    bucket
} = require("../../config/firebase");

const auth = getAuth();

class AuthService {
    async signUp(req, res) { //register
        const { fullName, email, username, password } = req.body;
        if (!fullName || !email || !username || !password) {
            return res.status(422).json({
                fullName: "Full name is required",
                email: "Email is required",
                username: "Username is required",
                password: "Password is required",
            });
        }
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                db.collection("users").doc(userCredential.user.uid).set({
                    fullname: fullName,
                    username: username,
                    email: userCredential.user.email,
                    password: password,
                    createdAt: new Date(),
                    address: null,
                    number : null,
                    url_photo: "",
                })
                sendEmailVerification(auth.currentUser)
                    .then(() => {
                        res.status(201).json({ message: "Verification email sent! User created successfully!" });
                    })
                .catch((error) => {
                    console.error(error.message);
                    res.status(500).json({ error: "Error sending email verification" });
                });
            })
        .catch((error) => {
            const errorMessage = error.message || "An error occurred while registering user";
            res.status(500).json({ error: errorMessage });
        });
    }

    async signIn(req, res) { //login
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(422).json({
                email: "email is required",
                password: "Password is required",
            });
        }
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => { 
                const idToken = await userCredential.user.getIdToken();
                if (idToken) {
                    res.status(200).json({ 
                        message: "User logged in successfully", 
                        token: idToken, 
                        user: {
                            uid: userCredential.user.uid,
                            email: userCredential.user.email,
                            emailVerified: userCredential.user.emailVerified,
                            isAnonymous: userCredential.user.isAnonymous
                        }
                    });
                    if (!userCredential.user.emailVerified) {
                        sendEmailVerification(auth.currentUser)
                        .then(() => {
                            console.log("Verification email sent!");
                        })
                        .catch((error) => {
                            console.error(error.message);
                        });
                    }
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            })
            .catch((error) => {
                console.error(error.message);
                const errorMessage = error.message || "An error occurred while logging in";
                res.status(500).json({ error: errorMessage });
            });
    }

    async logout(req, res) {
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "No user logged in" });
        }
        signOut(auth)
        .then(() => {
                res.status(200).json({ message: "User logged out successfully" });
        })
        .catch((error) => {
            console.error(error.message);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }

    async resetPassword(req, res){
        const { email } = req.body;
        if (!email ) {
            return res.status(422).json({
                email: "Email is required"
            });
        }
        sendPasswordResetEmail(auth, email)
        .then(() => {
            res.status(200).json({ message: "Password reset email sent successfully!" });
        })
        .catch((error) => {
            console.error(error.message);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }

    async getUserInfo(req, res) {
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "No user logged in" });
        }
        const user_ref = db.collection("users").doc(user.uid);
        user_ref.get().then((user_info) => {
            if (!user_info.exists) {
                res.status(404).json({ error: "User not found" });
            } else {
                res.status(200).json({ user: user_info.data() });
            }
        }).catch((error) => {
            console.error(error.message);
            res.status(500).json({ error: "Internal Server Error" });
        });
    }

    async changeUserData(req, res) {
        const { fullName, email, username, password, address, number } = req.body;
        const userId = req.user.uid;

        try {
            // Find user by ID
            const userRef = db.collection("users").doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(404).json({ message: "User not found" });
            }

            // Update only fields provided in the request
            const updatedData = {};
            if (fullName) updatedData.fullname = fullName;
            if (email) updatedData.email = email;
            if (username) updatedData.username = username;
            if (address) updatedData.address = address;
            if (number) updatedData.number = number;

            // Update the user's data in Firestore
            await userRef.update(updatedData);

            return res.status(200).json({ message: "User data updated successfully" });
        } catch (error) {
            console.error("Error updating user data: ", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        
    }

    async changePhotoProfile(req, res) {

    }
}

module.exports = new AuthService();