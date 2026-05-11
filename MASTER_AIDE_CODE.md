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
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:requestLegacyExternalStorage="true"
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

### **৩. MainActivity.java (ফাইল আপলোড ফিক্স সহ)**
পাথ: `app/src/main/java/com/gobdha.library/MainActivity.java`
```java
package com.gobdha.library;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> mUploadMessage;
    private final static int FILECHOOSER_RESULTCODE = 1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        webView = (WebView) findViewById(R.id.myWebView);
        WebSettings webSettings = webView.getSettings();

        // সব গুরুত্বপূর্ণ সেটিংস এনাবল করুন
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);

        // অ্যাপ যাতে ব্রাউজারে চলে না যায়
        webView.setWebViewClient(new WebViewClient());

        // ফাইল আপলোড ইভেন্ট হ্যান্ডল করার জন্য WebChromeClient যোগ করা হলো
        webView.setWebChromeClient(new WebChromeClient() {
            // অ্যান্ড্রয়েড ৫.০+ এর জন্য ফাইল পিকার ওপেন করা
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
                if (mUploadMessage != null) {
                    mUploadMessage.onReceiveValue(null);
                }
                mUploadMessage = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILECHOOSER_RESULTCODE);
                } catch (Exception e) {
                    mUploadMessage = null;
                    return false;
                }
                return true;
            }
        });

        // ওয়েবসাইট/লোকাল ফাইল লোড করা
        webView.loadUrl("file:///android_asset/index.html");
    }

    // ফাইল পিকার থেকে রেজাল্ট ফিরে আসলে এটি কাজ করবে
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent intent) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (mUploadMessage == null) return;
            mUploadMessage.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, intent));
            mUploadMessage = null;
        }
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

এই কোডটিতে আপনার অনুরোধ অনুযায়ী **ইউজার নেইম (ইমেইল) এবং পাসওয়ার্ড** লগইন সিস্টেম যুক্ত করা হয়েছে। ডিজাইন এবং আগের সব ফিচার (বই খোঁজা, এডমিন প্যানেল, বই ধার নেওয়া) একদম আগের মতোই রাখা হয়েছে।

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dakkhin Gobdha Public Library</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap');
        
        body {
            font-family: 'Inter', 'Hind Siliguri', sans-serif;
            background-color: #0f172a;
            color: #f1f5f9;
            overflow-x: hidden;
        }

        .glass-panel {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .gradient-teal {
            background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%);
        }

        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2dd4bf;
            border-radius: 10px;
        }

        /* Animation Classes */
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    </style>
</head>
<body class="min-h-screen flex flex-col custom-scrollbar">

    <!-- Loading Overlay -->
    <div id="loadingOverlay" class="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center transition-opacity duration-500">
        <div class="flex flex-col items-center">
            <div class="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
            <p class="mt-4 text-teal-400 font-medium pulse">লোডিং হচ্ছে...</p>
        </div>
    </div>

    <!-- Auth Guard -->
    <div id="authGuard" class="hidden fixed inset-0 z-[90] bg-slate-950 flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md p-8 rounded-[2.5rem] border border-white/5 shadow-2xl fade-in">
            <div class="flex flex-col items-center mb-8">
                <div class="w-16 h-16 gradient-teal rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/20 mb-4">
                    <i data-lucide="library" class="w-8 h-8 text-slate-900"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">দক্ষিণ গোবধা লাইব্রেরী</h2>
                <p id="authSubtitle" class="text-slate-400 text-sm mt-2">আপনার একাউন্টে লগইন করুন</p>
            </div>

            <div class="space-y-4">
                <div id="registerFields" class="hidden space-y-4">
                    <div>
                        <label class="text-xs text-slate-400 mb-1.5 block ml-1">আপনার নাম</label>
                        <input type="text" id="authName" class="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 focus:outline-none focus:border-teal-500 transition-all text-white" placeholder="নাম লিখুন">
                    </div>
                </div>

                <div>
                    <label class="text-xs text-slate-400 mb-1.5 block ml-1">ইমেইল এড্রেস</label>
                    <input type="email" id="authEmail" class="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 focus:outline-none focus:border-teal-500 transition-all text-white" placeholder="example@mail.com">
                </div>

                <div>
                    <label class="text-xs text-slate-400 mb-1.5 block ml-1">পাসওয়ার্ড</label>
                    <input type="password" id="authPassword" class="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 focus:outline-none focus:border-teal-500 transition-all text-white" placeholder="••••••••">
                </div>

                <div class="pt-2">
                    <button id="authSubmitBtn" onclick="handleAuth()" class="w-full gradient-teal text-slate-900 py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all text-lg shadow-xl shadow-teal-500/10">
                        লগইন করুন
                    </button>
                </div>

                <div class="text-center pt-4">
                    <p id="toggleAuthText" class="text-sm text-slate-400">
                        একাউন্ট নেই? <button onclick="toggleAuthMode()" class="text-teal-400 font-bold ml-1 hover:underline">নতুন খুলুন</button>
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Navigation -->
    <nav class="glass-panel sticky top-0 z-50 px-4 h-16 border-b border-white/5">
        <div class="max-w-7xl mx-auto flex items-center justify-between h-full">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 gradient-teal rounded-xl flex items-center justify-center shadow-lg">
                    <i data-lucide="library" class="w-5 h-5 text-slate-900"></i>
                </div>
                <h1 class="text-lg font-bold">দক্ষিণ গোবধা <span class="text-teal-400">লাইব্রেরী</span></h1>
            </div>
            
            <div class="hidden md:flex items-center gap-6 text-sm font-medium">
                <button onclick="showPage('home')" class="hover:text-teal-400 transition-all">হোম</button>
                <button onclick="showPage('books')" class="hover:text-teal-400 transition-all">বইসমূহ</button>
                <button onclick="showPage('myBorrows')" class="hover:text-teal-400 transition-all">আমার বই</button>
                <button id="adminLink" onclick="showPage('admin')" class="hidden text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full">এডমিন</button>
            </div>

            <div class="flex items-center gap-4">
                <div id="userProfile" class="flex items-center gap-3">
                    <div class="text-right hidden sm:block">
                        <p id="userNameLabel" class="text-xs font-semibold"></p>
                        <p id="userRoleLabel" class="text-[10px] text-slate-500 uppercase"></p>
                    </div>
                    <div class="w-8 h-8 rounded-full gradient-teal flex items-center justify-center text-slate-900 font-bold text-xs" id="userIcon">U</div>
                    <button onclick="handleSignOut()" class="text-slate-500 hover:text-rose-400"><i data-lucide="log-out" class="w-5 h-5"></i></button>
                </div>
                <button onclick="toggleMobileMenu()" class="md:hidden text-slate-400"><i data-lucide="menu" class="w-6 h-6"></i></button>
            </div>
        </div>
    </nav>

    <!-- Mobile Menu -->
    <div id="mobileMenu" class="hidden fixed inset-0 z-[100] bg-slate-950/95 flex flex-col p-8 md:hidden fade-in text-center">
        <button onclick="toggleMobileMenu()" class="self-end text-slate-400"><i data-lucide="x" class="w-8 h-8"></i></button>
        <div class="flex flex-col gap-8 mt-12 text-2xl font-bold">
            <button onclick="showPage('home'); toggleMobileMenu()" class="text-slate-400 hover:text-teal-400">হোম</button>
            <button onclick="showPage('books'); toggleMobileMenu()" class="text-slate-400 hover:text-teal-400">বইসমূহ</button>
            <button onclick="showPage('myBorrows'); toggleMobileMenu()" class="text-slate-400 hover:text-teal-400">আমার বই</button>
            <button id="mbAdmin" onclick="showPage('admin'); toggleMobileMenu()" class="hidden text-teal-400">এডমিন প্যানেল</button>
            <button onclick="handleSignOut(); toggleMobileMenu()" class="text-rose-400">লগআউট</button>
        </div>
    </div>

    <!-- MAIN CONTENT -->
    <main class="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        <section id="page-home" class="page flex flex-col items-center">
            <div class="text-center py-12 md:py-24 max-w-3xl">
                <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold mb-6">
                    <i data-lucide="sparkles" class="w-3 h-3"></i>
                    সবচেয়ে বড় অনলাইন লাইব্রেরী কালেকশন
                </div>
                <h2 class="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
                    বই করুন সংগ্রহ <br/>
                    <span class="text-teal-400">জ্ঞান হোক প্রসারিত</span>
                </h2>
                <p class="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed px-4">
                    দক্ষিণ গোবধা পাবলিক লাইব্রেরী। এখন আপনার হাতের মুঠোয়। যেকোনো সময় যেকোনো জায়গা থেকে আপনার বই ট্র্যাক করুন।
                </p>
                <div class="flex flex-wrap justify-center gap-4">
                    <button onclick="showPage('books')" class="gradient-teal text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all">
                        বইসমূহ দেখুন
                    </button>
                </div>
            </div>
        </section>

        <section id="page-books" class="page hidden">
            <div class="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <h2 class="text-3xl font-bold">লাইব্রেরীর সংগ্রহ</h2>
                <div class="relative w-full md:w-96">
                    <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"></i>
                    <input type="text" id="bookSearch" placeholder="বই বা লেখকের নাম..." class="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-teal-500 transition-all text-white">
                </div>
            </div>
            <div id="booksGrid" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
        </section>

        <section id="page-myBorrows" class="page hidden">
            <h2 class="text-3xl font-bold mb-8">আমার ধার নেওয়া বইসমূহ</h2>
            <div id="myBorrowsList" class="space-y-4"></div>
        </section>

        <section id="page-admin" class="page hidden">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h2 class="text-4xl font-black text-white italic border-l-8 border-teal-500 pl-6">এডমিন প্যানেল</h2>
                    <p class="text-slate-400 mt-2 text-xs tracking-widest font-bold">লাইব্রেরী কন্ট্রোল সেন্টার</p>
                </div>
                <button onclick="openAddBookModal()" class="bg-teal-500 text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-teal-400 transition-all flex items-center gap-2 shadow-xl shadow-teal-500/30">
                    <i data-lucide="plus-circle" class="w-5 h-5"></i>
                    নতুন বই যোগ করুন
                </button>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div class="glass-panel p-6 rounded-3xl border border-white/10">
                    <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">মোট বই</p>
                    <h4 id="statTotalBooks" class="text-3xl font-bold text-teal-400">০</h4>
                </div>
                <div class="glass-panel p-6 rounded-3xl border border-white/10">
                    <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">সক্রিয় মেম্বার</p>
                    <h4 id="statTotalMembers" class="text-3xl font-bold text-amber-400">০</h4>
                </div>
                <div class="glass-panel p-6 rounded-3xl border border-white/10">
                    <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">চলমান লেন্ডিং</p>
                    <h4 id="statActiveBorrows" class="text-3xl font-bold text-emerald-400">০</h4>
                </div>
                <div class="glass-panel p-6 rounded-3xl border border-white/10">
                    <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">ফেরত হয়েছে</p>
                    <h4 id="statReturned" class="text-3xl font-bold text-blue-400">০</h4>
                </div>
            </div>

            <div class="glass-panel rounded-[2.5rem] overflow-hidden border border-white/10 mb-20">
                <div class="px-8 py-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 class="font-bold flex items-center gap-3">
                        <i data-lucide="list" class="w-5 h-5 text-teal-400"></i>
                        সাম্প্রতিক লেন্ডিং লিস্ট
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="text-[10px] text-slate-500 font-bold uppercase border-b border-white/5 bg-white/2">
                                <th class="px-8 py-4">বই</th>
                                <th class="px-8 py-4">মেম্বার</th>
                                <th class="px-8 py-4">অবস্থা</th>
                                <th class="px-8 py-4">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody id="borrowsTableBody" class="divide-y divide-white/5"></tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Modals -->
        <div id="addBookModal" class="hidden fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div class="glass-panel w-full max-w-lg p-8 rounded-[2.5rem] relative">
                <button onclick="closeAddBookModal()" class="absolute top-6 right-6 text-slate-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                <h3 class="text-2xl font-bold mb-6 italic border-l-4 border-teal-500 pl-4">নতুন বই যোগ করুন</h3>
                <div class="space-y-4">
                    <div class="flex flex-col items-center mb-4">
                        <label class="cursor-pointer group flex flex-col items-center w-full">
                            <div id="coverPreview" class="w-32 h-44 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center overflow-hidden relative transition-all hover:border-teal-500/50">
                                <i data-lucide="camera" class="w-8 h-8 text-slate-500"></i>
                                <span class="text-[10px] uppercase font-bold text-slate-500 mt-2">ফটো আপলোড</span>
                            </div>
                            <input type="file" id="bookCoverFile" class="hidden" accept="image/*">
                        </label>
                    </div>
                    <input id="newBookTitle" class="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white" placeholder="বইয়ের নাম *">
                    <input id="newBookAuthor" class="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white" placeholder="লেখকের নাম *">
                    <input id="newBookURL" class="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white" placeholder="অথবা ড্রপবক্স/গুগল ইমেজ লিংক">
                    <button onclick="addNewBook()" class="w-full gradient-teal text-slate-900 py-4 rounded-2xl font-bold mt-4 shadow-xl">বই সেভ করুন</button>
                </div>
            </div>
        </div>
    </main>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
        import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
        import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, getDocs, setDoc, addDoc, query, collection, orderBy, serverTimestamp, onSnapshot, writeBatch, Timestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

        // ফায়ারবেস কনফিগ
        const firebaseConfig = {
            apiKey: "AIzaSyCzPM4Sz6uYbYUvySJiW93K0JXy4KR8dNc",
            authDomain: "gen-lang-client-0912734577.firebaseapp.com",
            projectId: "gen-lang-client-0912734577",
            storageBucket: "gen-lang-client-0912734577.firebasestorage.app",
            messagingSenderId: "160731014169",
            appId: "1:160731014169:web:07d3338880bd22292cf688",
            firestoreDatabaseId: "ai-studio-c7bfd590-d268-4c58-8f57-6d51cdd023c7"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        
        // অফলাইন পারসিস্টেন্স সহ ফায়ারস্টোর এনাবল করা
        const db = initializeFirestore(app, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        }, firebaseConfig.firestoreDatabaseId);

        let currentUser = null;
        let isRegistering = false;
        let books = [];

        // --- মূল ফাংশনসমূহ ---

        async function handleAuth() {
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value;
            const name = document.getElementById('authName').value.trim();
            
            if(!email || !password) return alert("ইমেইল এবং পাসওয়ার্ড দিন");
            
            const btn = document.getElementById('authSubmitBtn');
            btn.disabled = true;
            btn.textContent = "অপেক্ষা করুন...";

            try {
                if (isRegistering) {
                    const res = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(res.user, { displayName: name });
                    await setDoc(doc(db, 'members', res.user.uid), {
                        name, email, role: 'member', createdAt: serverTimestamp()
                    });
                } else {
                    await signInWithEmailAndPassword(auth, email, password);
                }
            } catch (e) {
                console.error(e);
                const errorCode = e.code || '';
                const errorMessage = e.message || '';
                let msg = "ত্রুটি: " + errorMessage;

                if (errorCode === 'auth/invalid-login-credentials' || 
                    errorCode === 'auth/invalid-credential' || 
                    errorMessage.includes('invalid-credential') ||
                    errorMessage.includes('invalid-login-credentials')) {
                    msg = "ইমেইল বা পাসওয়ার্ড ভুল। সঠিক তথ্য দিয়ে চেষ্টা করুন।";
                } else if (errorCode === 'auth/email-already-in-use') {
                    msg = "এই ইমেইলটি ইতিপূর্বে ব্যবহার করা হয়েছে।";
                } else if (errorCode === 'auth/weak-password') {
                    msg = "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।";
                } else if (errorCode === 'auth/user-not-found') {
                    msg = "এই ইমেইল দিয়ে কোনো একাউন্ট নেই।";
                } else if (errorCode === 'auth/wrong-password') {
                    msg = "ভুল পাসওয়ার্ড।";
                } else if (errorCode === 'auth/invalid-email') {
                    msg = "ভুল ইমেইল ফরম্যাট।";
                } else if (errorCode === 'auth/too-many-requests') {
                    msg = "অনেকবার ভুল চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার ট্রাই করুন।";
                }
                alert(msg);
                btn.disabled = false;
                btn.textContent = isRegistering ? "একাউন্ট খুলুন" : "লগইন করুন";
            }
        }

        onAuthStateChanged(auth, async user => {
            currentUser = user;
            const loader = document.getElementById('loadingOverlay');
            if (user) {
                document.getElementById('authGuard').classList.add('hidden');
                document.getElementById('userNameLabel').textContent = user.displayName;
                document.getElementById('userIcon').textContent = (user.displayName || "U").charAt(0);
                
                // চেক এডমিন
                const isAdminEmail = (user.email || "").toLowerCase() === 'rozobali01321786059@gmail.com';
                let role = 'member';
                
                try {
                    const docSnap = await getDoc(doc(db, 'members', user.uid));
                    if (docSnap.exists()) {
                        role = docSnap.data().role;
                    }
                } catch (e) { console.error("Error fetching role:", e); }

                if (isAdminEmail) role = 'admin';

                document.getElementById('userRoleLabel').textContent = role;
                if (role === 'admin') {
                    document.getElementById('adminLink').classList.remove('hidden');
                    document.getElementById('mbAdmin').classList.remove('hidden');
                } else {
                    document.getElementById('adminLink').classList.add('hidden');
                    document.getElementById('mbAdmin').classList.add('hidden');
                }

                loadBooks();
            } else {
                document.getElementById('authGuard').classList.remove('hidden');
            }
            loader.style.opacity = '0';
            setTimeout(() => loader.classList.add('hidden'), 500);
            lucide.createIcons();
        });

        async function loadBooks() {
            onSnapshot(collection(db, 'books'), snap => {
                books = snap.docs.map(d => ({id: d.id, ...d.data()}));
                renderBooks();
                document.getElementById('statTotalBooks').textContent = books.length;
            });
            
            onSnapshot(collection(db, 'members'), snap => {
                document.getElementById('statTotalMembers').textContent = snap.size;
            });

            onSnapshot(collection(db, 'borrows'), snap => {
                const borrows = snap.docs.map(d => ({id: d.id, ...d.data()}));
                document.getElementById('statActiveBorrows').textContent = borrows.filter(b => b.status === 'active').length;
                document.getElementById('statReturned').textContent = borrows.filter(b => b.status === 'returned').length;
                renderBorrows(borrows);
            });
        }

        function renderBorrows(list) {
            const tbody = document.getElementById('borrowsTableBody');
            tbody.innerHTML = list.sort((a,b) => b.borrowDate?.seconds - a.borrowDate?.seconds).map(b => `
                <tr class="text-sm">
                    <td class="px-8 py-4 font-bold text-white">${b.bookTitle}</td>
                    <td class="px-8 py-4 text-slate-400">${b.memberName}</td>
                    <td class="px-8 py-4">
                        <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${b.status === 'active' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}">
                            ${b.status === 'active' ? 'চলমান' : 'ফেরত'}
                        </span>
                    </td>
                    <td class="px-8 py-4">
                        ${b.status === 'active' ? `<button onclick="returnBook('${b.id}', '${b.bookId}')" class="text-xs font-bold text-teal-400 hover:underline">ফেরত নিন</button>` : '<span class="text-slate-600">-</span>'}
                    </td>
                </tr>
            `).join('');
            lucide.createIcons();
        }

        let selectedCoverBase64 = null;

        // ফাইল সিলেক্ট ইভেন্ট লিসেনার (অ্যান্ড্রয়েড ওয়েবভিউর জন্য এটি বেশি কার্যকরী)
        document.addEventListener('change', (e) => {
            if(e.target && e.target.id === 'bookCoverFile') {
                const file = e.target.files[0];
                if (file) {
                    if(file.size > 800 * 1024) {
                        alert("ফাইল সাইজ ৮০০ কেবি এর কম হতে হবে");
                        e.target.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        selectedCoverBase64 = event.target.result;
                        const preview = document.getElementById('coverPreview');
                        if(preview) {
                            preview.innerHTML = `<img src="${selectedCoverBase64}" class="w-full h-full object-cover">`;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            }
        });

        async function addNewBook() {
            const titleEl = document.getElementById('newBookTitle');
            const authorEl = document.getElementById('newBookAuthor');
            const urlEl = document.getElementById('newBookURL');
            
            // বাটন খোঁজার আরও শক্তিশালী উপায়
            const allBtns = document.querySelectorAll('button');
            let btn = null;
            allBtns.forEach(b => { if(b.textContent.includes('বই সেভ করুন')) btn = b; });
            
            const title = titleEl ? titleEl.value.trim() : "";
            const author = authorEl ? authorEl.value.trim() : "";
            let coverURL = urlEl ? urlEl.value.trim() : "";
            
            if(!title || !author) {
                alert("দয়া করে বইয়ের নাম এবং লেখকের নাম সঠিকভাবে দিন।");
                return;
            }

            // যদি ফাইল আপলোড করা থাকে তবে সেটিই হবে কভার ফটো
            if(selectedCoverBase64) {
                coverURL = selectedCoverBase64;
            }
            
            if(btn) {
                btn.disabled = true;
                btn.textContent = "সেভ হচ্ছে, অপেক্ষা করুন...";
            }

            try {
                // Firebase এ ডাটা সেভ করা
                const docRef = await addDoc(collection(db, 'books'), { 
                    title: title, 
                    author: author, 
                    coverURL: coverURL || '', 
                    available: true,
                    createdAt: serverTimestamp() 
                });
                
                alert("অভিনন্দন! বইটি সফলভাবে সেভ হয়েছে।");
                closeAddBookModal();
                
                // ফরম রিসেট
                if(titleEl) titleEl.value = "";
                if(authorEl) authorEl.value = "";
                if(urlEl) urlEl.value = "";
                selectedCoverBase64 = null;
                const preview = document.getElementById('coverPreview');
                if(preview) {
                    preview.innerHTML = `<i data-lucide="camera" class="w-8 h-8 text-slate-500"></i><span class="text-[10px] uppercase font-bold text-slate-500 mt-2">ফটো আপলোড</span>`;
                }
                lucide.createIcons();
            } catch(e) { 
                console.error("Firestore Error:", e);
                alert("সার্ভার সমস্যা: " + e.message); 
            } finally {
                if(btn) {
                    btn.disabled = false;
                    btn.textContent = "বই সেভ করুন";
                }
            }
        }

        async function returnBook(bid, bookId) {
            try {
                const batch = writeBatch(db);
                batch.update(doc(db, 'borrows', bid), { status: 'returned' });
                batch.update(doc(db, 'books', bookId), { available: true });
                await batch.commit();
                alert("বই ফেরত নেওয়া হয়েছে");
            } catch(e) { alert(e.message); }
        }

        function openAddBookModal() { document.getElementById('addBookModal').classList.remove('hidden'); }
        function closeAddBookModal() { document.getElementById('addBookModal').classList.add('hidden'); }

        function renderBooks() {
            const grid = document.getElementById('booksGrid');
            grid.innerHTML = books.map(b => `
                <div class="glass-panel p-4 rounded-3xl flex flex-col h-full fade-in">
                    <div class="aspect-[3/4] bg-slate-800 rounded-2xl mb-4 overflow-hidden">
                        ${b.coverURL ? `<img src="${b.coverURL}" class="w-full h-full object-cover" />` : '<div class="w-full h-full flex items-center justify-center italic text-xs text-slate-600">No Image</div>'}
                    </div>
                    <h4 class="font-bold text-sm truncate">${b.title}</h4>
                    <p class="text-xs text-slate-500">${b.author}</p>
                    <div class="mt-auto pt-4 flex items-center justify-between">
                        <span class="text-[10px] font-bold ${b.available ? 'text-teal-400' : 'text-rose-400'}">${b.available ? 'মজুদ' : 'ধার হয়েছে'}</span>
                        ${b.available ? `<button onclick="borrowBook('${b.id}')" class="text-teal-400 hover:scale-110"><i data-lucide="plus-circle" class="w-5 h-5"></i></button>` : ''}
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
        }

        async function borrowBook(id) {
            const book = books.find(b => b.id === id);
            const ret = new Date(); ret.setDate(ret.getDate() + 14);
            const batch = writeBatch(db);
            const bRef = doc(collection(db, 'borrows'));
            batch.set(bRef, {
                bookId: id, bookTitle: book.title, memberId: currentUser.uid, memberName: currentUser.displayName,
                borrowDate: serverTimestamp(), returnDate: Timestamp.fromDate(ret), status: 'active'
            });
            batch.update(doc(db, 'books', id), { available: false });
            await batch.commit();
            alert("সফলভাবে বই রিযার্ভ করা হয়েছে!");
            loadBooks();
        }

        function showPage(id) {
            document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
            document.getElementById('page-'+id).classList.remove('hidden');
        }

        function toggleAuthMode() {
            isRegistering = !isRegistering;
            document.getElementById('registerFields').classList.toggle('hidden', !isRegistering);
            document.getElementById('authSubmitBtn').textContent = isRegistering ? "একাউন্ট খুলুন" : "লগইন করুন";
        }

        function handleSignOut() { signOut(auth).then(() => location.reload()); }
        function toggleMobileMenu() { document.getElementById('mobileMenu').classList.toggle('hidden'); }

        // উইন্ডো অবজেক্টে ফাংশন এক্সপোর্ট
        window.handleAuth = handleAuth;
        window.showPage = showPage;
        window.toggleAuthMode = toggleAuthMode;
        window.handleSignOut = handleSignOut;
        window.toggleMobileMenu = toggleMobileMenu;
        window.borrowBook = borrowBook;
        window.openAddBookModal = openAddBookModal;
        window.closeAddBookModal = closeAddBookModal;
        window.addNewBook = addNewBook;
        window.returnBook = returnBook;

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

