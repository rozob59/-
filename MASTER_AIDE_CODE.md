# এআইডিই (AIDE) মাস্টার কোড গাইড - সম্পূর্ণ ফিক্স (WebView Method)

আপনার লগইন এরর ("Invalid action") এবং ফাইল নট ফাউন্ড ফিক্স করার জন্য নিচের কোডগুলো ব্যবহার করুন। আগের সব কোড ডিলিট করে এগুলো কপি-পেস্ট করুন।

### **১. AndroidManifest.xml (সম্পূর্ণ কোড)**
পাথ: `app/src/main/AndroidManifest.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.gobdha.library" >

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar" >
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize" >
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### **২. main.xml (Layout)**
পাথ: `app/src/main/res/layout/main.xml`
*(আপনার ফাইলে যদি `activity_main.xml` নাম থাকে, তবে সেই নামেই এটি পেস্ট করুন)*
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView
        android:id="@+id/myWebView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</LinearLayout>
```

### **৩. MainActivity.java**
পাথ: `app/src/main/java/com/gobdha/library/MainActivity.java`
```java
package com.gobdha.library;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main); // এখানে Layout ফাইলের নাম ঠিক থাকতে হবে

        webView = (WebView) findViewById(R.id.myWebView);
        WebSettings webSettings = webView.getSettings();

        // সব সেটিংস অন করুন যাতে ফায়ারবেস কাজ করে
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);

        // অ্যাপ যাতে ব্রাউজারে চলে না যায়
        webView.setWebViewClient(new WebViewClient());

        // ফাইল লোড করা (assets ফোল্ডারে index.html থাকতে হবে)
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

### **৪. index.html (Assets ফাইলে বসাবেন)**
পাথ: `app/src/main/assets/index.html`
**(এটি আপনার মেইন অ্যাপের কোড। আপনার ফায়ারবেস কনফিগারেশন এখানে দিয়ে দিলাম)**
```html
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DGPL Library</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-auth-compat.js"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center p-6">

    <!-- Login UI -->
    <div id="login-form" class="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl">
        <h2 class="text-3xl font-bold text-teal-400 mb-8 text-center">লাইব্রেরী লগইন</h2>
        <input type="email" id="email" placeholder="ইমেইল" class="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-teal-400">
        <input type="password" id="password" placeholder="পাসওয়ার্ড" class="w-full p-3 mb-6 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-teal-400">
        <button onclick="login()" id="loginBtn" class="w-full bg-teal-400 hover:bg-teal-500 text-black font-bold py-3 rounded-lg transition-all">প্রবেশ করুন</button>
        <p id="msg" class="mt-4 text-center text-red-500 text-sm"></p>
    </div>

    <!-- App UI (Hidden initially) -->
    <div id="app-content" class="hidden w-full max-w-4xl">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-2xl font-bold text-teal-400">বইয়ের তালিকা</h2>
            <button onclick="logout()" class="bg-red-500 px-4 py-2 rounded-lg text-sm">লগ আউট</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="book-list">
            <!-- Books will be listed here -->
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">বই ১: বাংলা সাহিত্য</div>
            <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">বই ২: গণিত সমাধান</div>
        </div>
    </div>

    <script>
        // আপনার রিয়েল ফায়ারবেস কনফিগারেশন
        const firebaseConfig = {
            apiKey: "AIzaSyCzPM4Sz6uYbYUvySJiW93K0JXy4KR8dNc",
            authDomain: "gen-lang-client-0912734577.firebaseapp.com",
            projectId: "gen-lang-client-0912734577",
            storageBucket: "gen-lang-client-0912734577.firebasestorage.app",
            messagingSenderId: "160731014169",
            appId: "1:160731014169:web:07d3338880bd22292cf688"
        };

        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();

        function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('loginBtn');
            const msg = document.getElementById('msg');

            if(!email || !password) return alert('সব তথ্য দিন');

            btn.disabled = true;
            btn.innerText = 'অপেক্ষা করুন...';

            auth.signInWithEmailAndPassword(email, password)
                .then((user) => {
                    msg.innerText = "";
                    showApp();
                })
                .catch((error) => {
                    btn.disabled = false;
                    btn.innerText = 'প্রবেশ করুন';
                    msg.innerText = "ভুল ইমেইল বা পাসওয়ার্ড অথবা সার্ভিস অফ আছে।";
                    console.error(error);
                });
        }

        function showApp() {
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('app-content').classList.remove('hidden');
        }

        function logout() {
            auth.signOut().then(() => location.reload());
        }

        // চেক করুন ইউজার কি আগে থেকে লগইন করা কিনা
        auth.onAuthStateChanged((user) => {
            if (user) showApp();
        });
    </script>
</body>
</html>
```

---

### **⚠️ অতি জরুরি কাজ (এইটা না করলে লগইন হবে না)**
ফায়ারবেস সাইটে গিয়ে **Email/Password** অপশনটি চালু করতে হবে:

১. এই লিঙ্কে যান: [Firebase Console Auth](https://console.firebase.google.com/project/gen-lang-client-0912734577/authentication/providers)
২. **Add new provider** এ ক্লিক করুন।
৩. **Email/Password** সিলেক্ট করুন এবং এটি **Enable** করে দিন।
৪. এরপর একটি ইউজার তৈরি করুন (Users ট্যাবে গিয়ে)।

তারপর আ্যাপটি আবার রান করুন। সব কাজ করবে।

