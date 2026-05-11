# এআইডিই (AIDE) মাস্টার কোড গাইড - সর্বশেষ আপডেট (Native Notification Fix)
> **সর্বশেষ আপডেট:** ১১ মে ২০২৬ (বিকেল ৮:৫৯)

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
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

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
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.Manifest;
import android.content.pm.PackageManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.webkit.JavascriptInterface;
import android.app.Notification;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> mUploadMessage;
    private final static int FILECHOOSER_RESULTCODE = 1;
    private static final String CHANNEL_ID = "library_notifs";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);

        createNotificationChannel();

        // অ্যান্ড্রয়েড ১৩+ এর জন্য নোটিফিকেশন পারমিশন চেক করা
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 101);
            }
        }

        webView = (WebView) findViewById(R.id.myWebView);
        WebSettings webSettings = webView.getSettings();

        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);

        // জাভাস্ক্রিপ্ট ব্রিজ (Android.showNotification)
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
                if (mUploadMessage != null) mUploadMessage.onReceiveValue(null);
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

        webView.loadUrl("file:///android_asset/index.html");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Library Notifications", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Notifications for library updates");
            NotificationManager nm = getSystemService(NotificationManager.class);
            nm.createNotificationChannel(channel);
        }
    }

    // জাভা কোড যা জাভাস্ক্রিপ্ট থেকে কল করা যাবে
    public class WebAppInterface {
        Context mContext;
        WebAppInterface(Context c) { mContext = c; }

        @JavascriptInterface
        public void showNotification(String title, String message) {
            try {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                Intent intent = new Intent(mContext, MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                PendingIntent pendingIntent = PendingIntent.getActivity(mContext, (int)System.currentTimeMillis(), intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                Notification.Builder builder;
                if (Build.VERSION.SDK_INT >= 26) {
                    builder = new Notification.Builder(mContext, CHANNEL_ID);
                } else {
                    builder = new Notification.Builder(mContext);
                }

                builder.setContentTitle(title)
                       .setContentText(message)
                       .setSmallIcon(android.R.drawable.ic_dialog_info) // সিস্টেম আইকন ব্যবহার করছি সেফটির জন্য
                       .setContentIntent(pendingIntent)
                       .setAutoCancel(true);

                nm.notify((int) System.currentTimeMillis(), builder.build());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
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

        /* CSS Animations */
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

        /* Modal & Dialog Styles */
        #confirmModal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; opacity: 0; pointer-events: none; transition: all 0.3s ease; }
        #confirmModal.show { opacity: 1; pointer-events: auto; }
        .confirm-card { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 2rem; width: 90%; max-width: 400px; transform: scale(0.9); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        #confirmModal.show .confirm-card { transform: scale(1); }

        /* Toast Styles */
        #toast-container { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 0.75rem; pointer-events: none; }
        .toast { 
            pointer-events: auto;
            min-width: 280px;
            max-width: 90vw;
            padding: 1rem 1.25rem;
            border-radius: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast.show { transform: translateY(0); opacity: 1; }
        .toast-success { border-left: 4px solid #2dd4bf; }
        .toast-error { border-left: 4px solid #f43f5e; }
        .toast-info { border-left: 4px solid #0ea5e9; }
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

                <div class="text-right">
                    <button onclick="handleForgotPassword()" class="text-[10px] text-slate-500 hover:text-teal-400 font-bold transition-colors">পাসওয়ার্ড ভুলে গেছেন?</button>
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
                <button onclick="showPage('notifications')" class="hover:text-teal-400 transition-all relative">
                    নোটিফিকেশন
                    <span id="notifBadge" class="hidden absolute -top-1 -right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
                </button>
                <button id="adminLink" onclick="showPage('admin')" class="hidden text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full">এডমিন</button>
            </div>

            <div class="flex items-center gap-4">
                <div id="userProfile" class="flex items-center gap-4">
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
            <button onclick="showPage('notifications'); toggleMobileMenu()" class="text-slate-400 hover:text-teal-400">নোটিফিকেশন</button>
            <button id="mbAdmin" onclick="showPage('admin'); toggleMobileMenu()" class="hidden text-teal-400">এডমিন প্যানেল</button>
            <button onclick="handleSignOut(); toggleMobileMenu()" class="text-rose-400">লগআউট</button>
        </div>
    </div>

    <!-- MAIN CONTENT -->
    <main class="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        <section id="page-home" class="page flex flex-col items-center">
            <!-- Hero Section -->
            <div class="text-center py-16 md:py-28 max-w-4xl px-4">
                <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-black uppercase tracking-widest mb-8 fade-in">
                    <i data-lucide="sparkles" class="w-4 h-4"></i>
                    সবচেয়ে বড় অনলাইন লাইব্রেরী কালেকশন
                </div>
                <h2 class="text-6xl md:text-8xl font-[900] mb-8 tracking-tighter leading-[0.95] text-white">
                    বই করুন সংগ্রহ <br/>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">জ্ঞান হোক প্রসারিত</span>
                </h2>
                <p class="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                    দক্ষিণ গোবধা পাবলিক লাইব্রেরী। এখন আপনার হাতের মুঠোয়। যেকোনো সময় যেকোনো জায়গা থেকে আপনার বই ট্র্যাক করুন।
                </p>
                <div class="flex flex-wrap justify-center gap-6">
                    <button onclick="showPage('books')" class="gradient-teal text-slate-900 px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                        বইসমূহ দেখুন
                        <i data-lucide="arrow-right" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>

            <!-- Features Grid -->
            <div class="grid md:grid-cols-3 gap-6 w-full max-w-6xl px-4 pb-20">
                <div class="glass-panel p-10 rounded-[3rem] border border-white/10 hover:bg-white/5 transition-all group">
                    <div class="w-16 h-16 bg-teal-500/10 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <i data-lucide="book" class="w-8 h-8 text-teal-400"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">বিশাল সংগ্রহ</h3>
                    <p class="text-slate-400 leading-relaxed font-medium">
                        আমাদের সংগ্রহে রয়েছে কয়েক হাজার বই যা আপনি যেকোনো সময় নিতে পারবেন।
                    </p>
                </div>
                <div class="glass-panel p-10 rounded-[3rem] border border-white/10 hover:bg-white/5 transition-all group">
                    <div class="w-16 h-16 bg-rose-500/10 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <i data-lucide="bell" class="w-8 h-8 text-rose-400"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">স্মার্ট নোটিফিকেশন</h3>
                    <p class="text-slate-400 leading-relaxed font-medium">
                        বইয়ের ফেরত দেওয়ার সময় হলে বা নতুন নতুন বই আসলে অটোমেটিক আপডেট পান।
                    </p>
                </div>
                <div class="glass-panel p-10 rounded-[3rem] border border-white/10 hover:bg-white/5 transition-all group">
                    <div class="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <i data-lucide="history" class="w-8 h-8 text-emerald-400"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">সহজ ট্র্যাকিং</h3>
                    <p class="text-slate-400 leading-relaxed font-medium">
                        আপনি কবে কোন বই নিয়েছিলেন তার সব রেকর্ড আপনার হাতের মুঠোয়।
                    </p>
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
            <h2 class="text-3xl font-bold mb-8 italic border-l-4 border-amber-500 pl-4">আমার ধার নেওয়া বইসমূহ</h2>
            <div id="myBorrowsList" class="grid sm:grid-cols-2 gap-4"></div>
        </section>

        <section id="page-notifications" class="page hidden">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-3xl font-bold italic border-l-4 border-sky-500 pl-4">নোটিফিকেশনস</h2>
                <div class="flex items-center gap-4">
                <span id="unreadCountBadge" class="hidden bg-teal-500/20 text-teal-400 border border-teal-500/30 px-4 py-1.5 rounded-full text-xs font-bold fade-in"></span>
            </div>
        </div>
            <div id="notificationsList" class="space-y-4"></div>
        </section>

        <section id="page-admin" class="page hidden">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h2 class="text-4xl font-black text-white italic border-l-8 border-teal-500 pl-6">এডমিন প্যানেল</h2>
                    <p class="text-slate-400 mt-2 text-xs tracking-widest font-bold">লাইব্রেরী কন্ট্রোল সেন্টার</p>
                </div>
                <div class="flex flex-wrap gap-4">
                    <button onclick="resetSystem()" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-6 py-3 rounded-2xl font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 shadow-xl">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                        রিসেট ডাটা
                    </button>
                    <button onclick="clearNotifications()" class="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-6 py-3 rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center gap-2 shadow-xl">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                        নোটিফিকেশন ক্লিয়ার
                    </button>
                    <button onclick="openAddBookModal()" class="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center gap-2 shadow-xl">
                        <i data-lucide="plus-circle" class="w-5 h-5 text-teal-400"></i>
                        বই যোগ করুন
                    </button>
                    <button onclick="openIssueBookModal()" class="bg-teal-500 text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-teal-400 transition-all flex items-center gap-2 shadow-xl shadow-teal-500/30">
                        <i data-lucide="book-open" class="w-5 h-5"></i>
                        বই ইস্যু করুন
                    </button>
                    <button onclick="openAddMemberModal()" class="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center gap-2 shadow-xl">
                        <i data-lucide="user-plus" class="w-5 h-5 text-teal-400"></i>
                        সদস্য যোগ
                    </button>
                </div>
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

            <div class="glass-panel rounded-[2.5rem] overflow-hidden border border-white/10 mb-10">
                <div class="px-8 py-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 class="font-bold flex items-center gap-3">
                        <i data-lucide="users" class="w-5 h-5 text-teal-400"></i>
                        সদস্যদের তালিকা
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="text-[10px] text-slate-500 font-bold uppercase border-b border-white/5 bg-white/2">
                                <th class="px-8 py-4">সদস্য</th>
                                <th class="px-8 py-4">ইমেইল</th>
                                <th class="px-8 py-4">রোল</th>
                                <th class="px-8 py-4">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody id="membersTableBody" class="divide-y divide-white/5"></tbody>
                    </table>
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

        <div id="issueBookModal" class="hidden fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div class="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative">
                <button onclick="closeIssueBookModal()" class="absolute top-6 right-6 text-slate-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                <h3 class="text-2xl font-bold mb-6 italic border-l-4 border-teal-500 pl-4">বই ইস্যু করুন</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-teal-400 uppercase mb-2 ml-1">সদস্য নির্বাচন করুন</label>
                        <select id="issueMemberSelect" class="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 focus:outline-none text-white appearance-none">
                            <option value="">সদস্য সিলেক্ট করুন</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-teal-400 uppercase mb-2 ml-1">বই নির্বাচন করুন</label>
                        <select id="issueBookSelect" class="w-full bg-slate-900 border border-white/10 rounded-2xl py-3.5 px-4 focus:outline-none text-white appearance-none">
                            <option value="">বই সিলেক্ট করুন</option>
                        </select>
                    </div>
                    <button id="issueBtn" onclick="confirmIssueBook()" class="w-full gradient-teal text-slate-900 py-4 rounded-2xl font-bold mt-4 shadow-xl">ইস্যু নিশ্চিত করুন</button>
                </div>
            </div>
        </div>

        <!-- Add Member Modal -->
        <div id="addMemberModal" class="hidden fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div class="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative">
                <button onclick="closeAddMemberModal()" class="absolute top-6 right-6 text-slate-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                <h3 class="text-2xl font-bold mb-6 italic border-l-4 border-teal-500 pl-4">নতুন সদস্য যোগ করুন</h3>
                <div class="space-y-4">
                    <input id="newMemberName" class="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white" placeholder="নাম *">
                    <input id="newMemberEmail" class="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white" placeholder="ইমেইল *">
                    <select id="newMemberRole" class="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white appearance-none">
                        <option value="member" class="bg-slate-900">MEMBER</option>
                        <option value="admin" class="bg-slate-900">ADMIN</option>
                    </select>
                    <button id="addMbrBtn" onclick="addNewMember()" class="w-full gradient-teal text-slate-900 py-4 rounded-2xl font-bold mt-4 shadow-xl">সদস্য যোগ করুন</button>
                </div>
            </div>
        </div>

        <!-- Notify User Modal -->
        <div id="notifyUserModal" class="hidden fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div class="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative">
                <button onclick="closeNotifyModal()" class="absolute top-6 right-6 text-slate-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                <h3 id="notifyModalTitle" class="text-2xl font-bold mb-6 italic border-l-4 border-teal-500 pl-4">নোটিফিকেশন পাঠান</h3>
                <div class="space-y-4">
                    <input id="notifTitle" class="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white" placeholder="শিরোনাম">
                    <textarea id="notifMessage" rows="4" class="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white resize-none" placeholder="বার্তা লিখুন..."></textarea>
                    <button id="sendNotifBtn" onclick="confirmSendNotification()" class="w-full gradient-teal text-slate-900 py-4 rounded-2xl font-bold mt-4 shadow-xl flex items-center justify-center gap-2">
                        <i data-lucide="send" class="w-5 h-5"></i>
                        পাঠান
                    </button>
                </div>
            </div>
        </div>

        <!-- Notification Details Modal -->
        <div id="notifDetailsModal" class="hidden fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div class="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative">
                <button onclick="closeNotifDetailsModal()" class="absolute top-6 right-6 text-slate-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                <h3 id="notifDetailsTitle" class="text-2xl font-bold mb-6 italic border-l-4 border-teal-500 pl-4"></h3>
                <p id="notifDetailsMessage" class="text-slate-300 leading-relaxed"></p>
            </div>
        </div>
    </main>

<script>
        let currentBorrowBookId = null;

        function closeBorrowBookModal() {
            document.getElementById('borrowBookModal').classList.add('hidden');
        }

        function showNotificationDetails(title, message) {
            document.getElementById('notifDetailsTitle').textContent = title;
            document.getElementById('notifDetailsMessage').textContent = message;
            document.getElementById('notifDetailsModal').classList.remove('hidden');
        }
        function closeNotifDetailsModal() {
            document.getElementById('notifDetailsModal').classList.add('hidden');
        }
    </script>

    <!-- Custom Confirm Modal -->
    <div id="confirmModal">
        <div class="confirm-card flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
                <i data-lucide="help-circle" class="w-8 h-8 text-rose-500"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">আপনি কি নিশ্চিত?</h3>
            <p id="confirmMessage" class="text-slate-400 text-sm mb-8">এটি করার ফলে ডাটা চিরতরে হারিয়ে যেতে পারে।</p>
            <div class="flex gap-4 w-full">
                <button id="confirmCancel" class="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all">বাতিল</button>
                <button id="confirmOk" class="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition-all shadow-lg shadow-rose-500/20">হ্যাঁ, মুছুন</button>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toast-container"></div>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
        import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
        import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, query, where, limit, collection, serverTimestamp, onSnapshot, writeBatch, Timestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
        let members = [];

        // টোস্ট নোটিফিকেশন সিস্টেম
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if(!container) return;

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            let icon = 'check-circle';
            if(type === 'error') icon = 'alert-circle';
            if(type === 'info') icon = 'info';

            toast.innerHTML = `
                <i data-lucide="${icon}" class="w-5 h-5 ${type === 'success' ? 'text-teal-400' : type === 'error' ? 'text-rose-400' : 'text-sky-400'}"></i>
                <span class="text-sm font-medium">${message}</span>
            `;

            container.appendChild(toast);
            lucide.createIcons();

            // অ্যান্ড্রয়েড/ব্রাউজার নোটিফিকেশন (যদি পারমিশন থাকে)
            console.log("Attempting notification:", message);
            if (typeof Android !== 'undefined' && Android.showNotification) {
                console.log("Calling Android Bridge...");
                Android.showNotification('লাইব্রেরী আপডেট', message);
            } else if ("Notification" in window && Notification.permission === 'granted') {
                try {
                    new Notification('লাইব্রেরী আপডেট', { 
                        body: message,
                        icon: 'https://cdn-icons-png.flaticon.com/512/1903/1903162.png'
                    });
                } catch (e) {
                    console.warn("Notification error:", e);
                }
            }

            // এনিমেশন স্টার্ট
            setTimeout(() => toast.classList.add('show'), 10);

            // রিমুভ টোস্ট
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }

        // কাস্টম কনফার্মেশন সিস্টেম
        function customConfirm(message) {
            return new Promise((resolve) => {
                const modal = document.getElementById('confirmModal');
                const msgEl = document.getElementById('confirmMessage');
                const okBtn = document.getElementById('confirmOk');
                const cancelBtn = document.getElementById('confirmCancel');

                msgEl.textContent = message;
                modal.classList.add('show');

                const handleOk = () => {
                    modal.classList.remove('show');
                    cleanup();
                    resolve(true);
                };

                const handleCancel = () => {
                    modal.classList.remove('show');
                    cleanup();
                    resolve(false);
                };

                const cleanup = () => {
                    okBtn.removeEventListener('click', handleOk);
                    cancelBtn.removeEventListener('click', handleCancel);
                };

                okBtn.addEventListener('click', handleOk);
                cancelBtn.addEventListener('click', handleCancel);
            });
        }

        // --- মূল ফাংশনসমূহ ---

        async function handleAuth() {
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value;
            const name = document.getElementById('authName').value.trim();
            
            if(!email || !password) return showToast("ইমেইল এবং পাসওয়ার্ড দিন", "error");
            
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
                
                // নোটিফিকেশন পারমিশন চাওয়া
                if ("Notification" in window) {
                    Notification.requestPermission();
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
                showToast(msg, "error");
                btn.disabled = false;
                btn.textContent = isRegistering ? "একাউন্ট খুলুন" : "লগইন করুন";
            }
        }

        async function handleForgotPassword() {
            const email = document.getElementById('authEmail').value.trim();
            if(!email) return showToast("আগে আপনার ইমেইলটি লিখুন", "error");
            
            try {
                await sendPasswordResetEmail(auth, email);
                showToast("পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে।", "info");
            } catch(e) {
                console.error(e);
                showToast("লিংক পাঠানো যায়নি। ইমেইলটি সঠিক কিনা চেক করুন।", "error");
            }
        }

        async function resetSystem() {
            const confirmed = await customConfirm("আপনি কি নিশ্চিত যে সব বই এবং লেনদেন হিস্ট্রি মুছে ফেলতে চান? শুধু ইউজার একাউন্টগুলো থাকবে।");
            if(!confirmed) return;
            
            showToast("ডাটা ক্লিন হচ্ছে...", "info");
            try {
                const borrowsSnap = await getDocs(collection(db, 'borrows'));
                const booksSnap = await getDocs(collection(db, 'books'));
                
                const batch = writeBatch(db);
                borrowsSnap.docs.forEach(d => batch.delete(d.ref));
                booksSnap.docs.forEach(d => batch.delete(d.ref));
                
                await batch.commit();
                showToast("সব ক্লিন হয়ে গেছে! এবার নতুন বই যোগ করুন।", "success");
            } catch(e) {
                console.error(e);
                showToast("রিসেট করতে সমস্যা হয়েছে: "+e.message, "error");
            }
        }

        async function clearNotifications() {
            const confirmed = await customConfirm("আপনি কি নিশ্চিত যে সব নোটিফিকেশন মুছে ফেলতে চান? এটা আবার ফিরিয়ে আনা সম্ভব নয়।");
            if(!confirmed) return;

            try {
                // Get all notifications
                const snap = await getDocs(collection(db, 'notifications'));
                console.log("Notifications found to delete:", snap.docs.length);
                
                if (snap.docs.length === 0) {
                  showToast("কোনো নোটিফিকেশন নেই।", "info");
                  return;
                }
                
                // Firestore batch limit is 500
                const batch = writeBatch(db);
                let count = 0;
                snap.docs.forEach(d => {
                    batch.delete(d.ref);
                    count++;
                });
                
                await batch.commit();
                console.log("Deleted", count, "notifications.");
                showToast("সব নোটিফিকেশন সফলভাবে মোছা হয়েছে!");
            } catch (e) {
                console.error("Error clearing notifications:", e);
                showToast("নোটিফিকেশনগুলো মুছতে সমস্যা হয়েছে: " + (e instanceof Error ? e.message : String(e)));
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
                
                // লগইন হওয়ার পর একবারও নোটিফিকেশন পারমিশন না চাইলে চাবে
                if ("Notification" in window && Notification.permission === "default") {
                    Notification.requestPermission();
                }
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
            }, e => console.error("Books onSnapshot error:", e));
            
            onSnapshot(collection(db, 'members'), snap => {
                members = snap.docs.map(d => ({id: d.id, ...d.data()}));
                document.getElementById('statTotalMembers').textContent = snap.size;
                renderMembers();
            }, e => console.error("Members onSnapshot error:", e));

            onSnapshot(collection(db, 'borrows'), snap => {
                const borrows = snap.docs.map(d => ({id: d.id, ...d.data()}));
                document.getElementById('statActiveBorrows').textContent = borrows.filter(b => b.status === 'active').length;
                document.getElementById('statReturned').textContent = borrows.filter(b => b.status === 'returned').length;
                renderBorrows(borrows);
                
                // ইউজার ডেটা ফিল্টার
                const myActive = borrows.filter(b => b.memberId === currentUser.uid);
                renderMyBorrows(myActive);
                checkReminders(myActive.filter(b => b.status === 'active'));
            }, e => console.error("Borrows onSnapshot error:", e));

            // নোটিফিকেশন লিসেনার
            const qNotif = query(collection(db, 'notifications'), where('userId', 'in', [currentUser.uid, 'all']));
            let isInitialLoad = true;
            onSnapshot(qNotif, snap => {
                snap.docChanges().forEach(change => {
                    if (change.type === "added") {
                        const n = change.doc.data();
                        // যদি ডাটাবেজ থেকে ডাটা প্রথমবার লোড হবার পর নতুন কিছু এড হয়
                        if (!isInitialLoad) {
                            console.log("New realtime notification:", n.title);
                            showToast(n.title, 'info');
                            if (typeof Android !== 'undefined' && Android.showNotification) {
                                Android.showNotification(n.title, n.message);
                            } else if ("Notification" in window && Notification.permission === 'granted') {
                                new Notification(n.title, { body: n.message });
                            }
                        }
                    }
                });
                
                isInitialLoad = false;
                const notifs = snap.docs.map(d => ({id: d.id, ...d.data()}));
                renderNotifications(notifs);
                const unread = notifs.filter(n => !n.read).length;
                
                const badge = document.getElementById('notifBadge');
                if(badge) badge.classList.toggle('hidden', unread === 0);

                const countLabel = document.getElementById('unreadCountBadge');
                if(countLabel) {
                    countLabel.textContent = `${unread} টি নতুন`;
                    countLabel.classList.toggle('hidden', unread === 0);
                }
            }, e => {
                console.error("Notifications onSnapshot error:", e);
                const container = document.getElementById('notificationsList');
                if(container && isInitialLoad) {
                    container.innerHTML = `<div class="py-10 text-center text-rose-400">ত্রুটি: নোটিফিকেশন লোড করা যায়নি (ইন্ডেক্স তৈরি হতে পারে)</div>`;
                }
            });
        }

        function renderBorrows(list) {
            const tbody = document.getElementById('borrowsTableBody');
            if(!tbody) return;
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

        function renderMyBorrows(list) {
            const grid = document.getElementById('myBorrowsList');
            if(!grid) return;
            if(list.length === 0) {
                grid.innerHTML = '<div class="col-span-full py-20 text-center text-slate-500 italic">আপনি কোনো বই ধার নেননি।</div>';
                return;
            }
            grid.innerHTML = list.sort((a,b) => b.borrowDate?.seconds - a.borrowDate?.seconds).map(b => {
                const dDate = b.dueDate instanceof Timestamp ? b.dueDate.toDate() : (b.dueDate ? new Date(b.dueDate) : new Date());
                const isOverdue = b.status === 'active' && dDate < new Date();
                
                return `
                <div class="glass-panel p-6 rounded-[2rem] flex flex-col gap-4 fade-in">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-16 bg-slate-800 rounded-xl flex-shrink-0 flex items-center justify-center">
                            <i data-lucide="book" class="w-6 h-6 text-slate-600"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-white text-sm">${b.bookTitle}</h4>
                            <p class="text-[10px] sm:text-xs mt-1 ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-500'}">
                                ${b.status === 'active' ? `ফেরত: ${dDate.toLocaleDateString('bn-BD')}` : 'ফেরত দেওয়া হয়েছে'}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                        <span class="text-[9px] font-bold uppercase tracking-widest ${b.status === 'active' ? 'text-amber-400' : 'text-emerald-400'}">
                            ${b.status === 'active' ? (isOverdue ? 'সময় শেষ' : 'চলমান') : 'সম্পন্ন'}
                        </span>
                        <div class="flex gap-2">
                             <i data-lucide="${b.status === 'active' ? 'clock' : 'check-circle-2'}" class="w-4 h-4 ${b.status === 'active' ? (isOverdue ? 'text-rose-500' : 'text-amber-500') : 'text-emerald-500'}"></i>
                        </div>
                    </div>
                </div>
            `}).join('');
            lucide.createIcons();
        }

        function renderNotifications(list) {
            const container = document.getElementById('notificationsList');
            if(!container) return;
            if(list.length === 0) {
                container.innerHTML = '<div class="py-20 text-center text-slate-500 italic">কোনো নোটিফিকেশন নেই</div>';
                return;
            }
            container.innerHTML = list.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0)).map(n => `
                <div class="glass-panel p-6 rounded-[2rem] flex gap-5 items-center transition-all ${n.read ? 'opacity-50 grayscale-[0.5]' : 'border-l-4 border-teal-500'}">
                    <div class="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center flex-shrink-0 cursor-pointer" onclick='showNotificationDetails("${n.title}", `${n.message.replace(/'/g, "\\'")}`)'>
                        <i data-lucide="${n.userId === 'all' ? 'megaphone' : 'bell'}" class="w-6 h-6 text-teal-400"></i>
                    </div>
                    <div class="flex-1 cursor-pointer" onclick='showNotificationDetails("${n.title}", `${n.message.replace(/'/g, "\\'")}`)'>
                        <div class="flex justify-between items-start mb-1">
                            <h5 class="font-bold text-white text-base">${n.title}</h5>
                            <span class="text-[10px] text-slate-500 font-medium">${n.createdAt ? new Date(n.createdAt.seconds*1000).toLocaleDateString('bn-BD') : ''}</span>
                        </div>
                        <p class="text-sm text-slate-400 leading-relaxed">${n.message}</p>
                    </div>
                    ${!n.read ? `
                        <button onclick="markAsRead('${n.id}')" class="w-10 h-10 rounded-xl bg-slate-800 text-teal-500 flex items-center justify-center hover:bg-teal-500 hover:text-slate-950 transition-all shadow-lg active:scale-90">
                            <i data-lucide="check" class="w-6 h-6"></i>
                        </button>
                    ` : `
                        <div class="w-10 h-10 flex items-center justify-center text-slate-700">
                             <i data-lucide="check-check" class="w-5 h-5"></i>
                        </div>
                    `}
                </div>
            `).join('');
            lucide.createIcons();
        }

        async function markAsRead(id) {
            try {
                await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
            } catch(e) {
                console.error("Error marking as read:", e);
                showToast("ত্রুটি হয়েছে", "error");
            }
        }

        let reminderShown = false;
        async function checkReminders(activeBorrows) {
            if(reminderShown) return;
            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
            const now = new Date();
            
            for(const b of activeBorrows) {
                if(!b.dueDate) continue;
                const dDate = b.dueDate instanceof Timestamp ? b.dueDate.toDate() : new Date(b.dueDate);
                
                if(dDate.toDateString() === tomorrow.toDateString()) {
                    showToast(`রিমাইন্ডার: "${b.bookTitle}" ফেরত দেওয়ার সময় আগামীকাল!`, 'info');
                    reminderShown = true;
                    break;
                } else if(dDate <= now) {
                    showToast(`এলার্ট: "${b.bookTitle}" ফেরত দেওয়ার সময় পার হয়ে গেছে!`, 'error');
                    reminderShown = true;
                    break;
                }
            }
        }

        let selectedCoverBase64 = null;

        // ফাইল সিলেক্ট ইভেন্ট লিসেনার (অ্যান্ড্রয়েড ওয়েবভিউর জন্য এটি বেশি কার্যকরী)
        document.addEventListener('change', (e) => {
            if(e.target && e.target.id === 'bookCoverFile') {
                const file = e.target.files[0];
                if (file) {
                    if(file.size > 800 * 1024) {
                        showToast("ফাইল সাইজ ৮০০ কেবি এর কম হতে হবে", "error");
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
                showToast("দয়া করে বইয়ের নাম এবং লেখকের নাম সঠিকভাবে দিন।", "error");
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

                // নতুন বইয়ের নোটিফিকেশন পাঠানো
                await addDoc(collection(db, 'notifications'), {
                    userId: 'all',
                    title: 'নতুন বই যুক্ত হয়েছে!',
                    message: `"${title}" বইটি এখন লাইব্রেরিতে পাওয়া যাচ্ছে। পড়ার জন্য সংগ্রহ করুন!`,
                    createdAt: serverTimestamp(),
                    read: false
                });
                
                showToast("অভিনন্দন! বইটি সফলভাবে সেভ হয়েছে।", "success");
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
                showToast("সার্ভার সমস্যা: " + e.message, "error"); 
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
                showToast("বই ফেরত নেওয়া হয়েছে", "success");
            } catch(e) { showToast(e.message, "error"); }
        }

        async function deleteBook(id) {
            console.log("Attempting to delete book:", id);
            const confirmed = await customConfirm("আপনি কি নিশ্চিত যে এই বইটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।");
            if(!confirmed) return;
            
            try {
                await deleteDoc(doc(db, 'books', id));
                showToast("বইটি সফলভাবে মুছে ফেলা হয়েছে।", "success");
                if(typeof loadBooks === 'function') loadBooks(); // রিফ্রেশ লিস্ট
            } catch(e) {
                console.error("Delete Error:", e);
                showToast("ভুল হয়েছে: " + (e.message || "Unknown error"), "error");
            }
        }

        function openAddBookModal() { document.getElementById('addBookModal').classList.remove('hidden'); }
        function closeAddBookModal() { document.getElementById('addBookModal').classList.add('hidden'); }

        function openIssueBookModal() {
            const memberSelect = document.getElementById('issueMemberSelect');
            const bookSelect = document.getElementById('issueBookSelect');
            
            memberSelect.innerHTML = '<option value="">সদস্য সিলেক্ট করুন</option>' + members.map(m => `<option value="${m.id}">${m.name} (${m.email})</option>`).join('');
            bookSelect.innerHTML = '<option value="">বই সিলেক্ট করুন</option>' + books.filter(b => b.available).map(b => `<option value="${b.id}">${b.title} - ${b.author}</option>`).join('');
            
            document.getElementById('issueBookModal').classList.remove('hidden');
        }
        function closeIssueBookModal() { document.getElementById('issueBookModal').classList.add('hidden'); }

        async function confirmIssueBook() {
            const memberId = document.getElementById('issueMemberSelect').value;
            const bookId = document.getElementById('issueBookSelect').value;
            const btn = document.getElementById('issueBtn');

            if(!memberId || !bookId) return showToast("সদস্য এবং বই উভয়ই সিলেক্ট করুন", "error");

            btn.disabled = true;
            btn.textContent = "ইস্যু হচ্ছে...";

            try {
                const book = books.find(b => b.id === bookId);
                const member = members.find(m => m.id === memberId);
                const dueDate = new Date(); 
                dueDate.setDate(dueDate.getDate() + 14);

                const batch = writeBatch(db);
                const bRef = doc(collection(db, 'borrows'));
                batch.set(bRef, {
                    bookId, 
                    bookTitle: book.title, 
                    memberId, 
                    memberName: member.name,
                    borrowDate: serverTimestamp(), 
                    dueDate: Timestamp.fromDate(dueDate), 
                    status: 'active'
                });
                batch.update(doc(db, 'books', bookId), { available: false });
                await batch.commit();

                showToast(`"${book.title}" সফলভাবে ${member.name} কে ইস্যু করা হয়েছে!`, "success");
                closeIssueBookModal();
            } catch(e) {
                showToast("ত্রুটি: " + e.message, "error");
            } finally {
                btn.disabled = false;
                btn.textContent = "ইস্যু নিশ্চিত করুন";
            }
        }

        function renderMembers() {
            const tbody = document.getElementById('membersTableBody');
            if(!tbody) return;
            tbody.innerHTML = members.map(m => `
                <tr class="text-sm">
                    <td class="px-8 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-teal-400 capitalize">
                                ${m.name ? m.name[0] : 'U'}
                            </div>
                            <span class="font-bold text-white">${m.name || 'Unknown'}</span>
                        </div>
                    </td>
                    <td class="px-8 py-4 text-slate-400">${m.email}</td>
                    <td class="px-8 py-4">
                        <span class="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${m.role === 'admin' ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-500/20 text-slate-400'}">
                            ${m.role || 'member'}
                        </span>
                    </td>
                    <td class="px-8 py-4">
                        <button onclick="openNotifyModal('${m.id}', '${m.name}')" class="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center hover:bg-teal-500 hover:text-slate-900 transition-all">
                            <i data-lucide="send" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            lucide.createIcons();
        }

        let selectedUserForNotif = null;
        function openNotifyModal(id, name) {
            selectedUserForNotif = id;
            document.getElementById('notifyModalTitle').textContent = `নোটিফিকেশন পাঠান: ${name}`;
            document.getElementById('notifyUserModal').classList.remove('hidden');
        }
        function closeNotifyModal() { document.getElementById('notifyUserModal').classList.add('hidden'); }

        async function confirmSendNotification() {
            const title = document.getElementById('notifTitle').value.trim();
            const message = document.getElementById('notifMessage').value.trim();
            const btn = document.getElementById('sendNotifBtn');

            if(!title || !message) return showToast("শিরোনাম এবং বার্তা লিখুন", "error");

            btn.disabled = true;
            btn.textContent = "পাঠানো হচ্ছে...";

            try {
                await addDoc(collection(db, 'notifications'), {
                    userId: selectedUserForNotif,
                    title,
                    message,
                    createdAt: serverTimestamp(),
                    read: false
                });
                showToast("নোটিফিকেশন পাঠানো হয়েছে!", "success");
                closeNotifyModal();
                document.getElementById('notifTitle').value = "";
                document.getElementById('notifMessage').value = "";
            } catch(e) {
                showToast("ত্রুটি: " + e.message, "error");
            } finally {
                btn.disabled = false;
                btn.textContent = "পাঠান";
                lucide.createIcons();
            }
        }

        function openAddMemberModal() { document.getElementById('addMemberModal').classList.remove('hidden'); }
        function closeAddMemberModal() { document.getElementById('addMemberModal').classList.add('hidden'); }

        async function addNewMember() {
            const name = document.getElementById('newMemberName').value.trim();
            const email = document.getElementById('newMemberEmail').value.trim();
            const role = document.getElementById('newMemberRole').value;
            const btn = document.getElementById('addMbrBtn');

            if(!name || !email) return showToast("নাম এবং ইমেইল দিন", "error");

            btn.disabled = true;
            btn.textContent = "অপেক্ষা করুন...";

            try {
                await addDoc(collection(db, 'members'), {
                    name, email, role, createdAt: serverTimestamp()
                });
                showToast("সদস্য যোগ করা হয়েছে!", "success");
                closeAddMemberModal();
                document.getElementById('newMemberName').value = "";
                document.getElementById('newMemberEmail').value = "";
            } catch(e) { showToast(e.message, "error"); }
            finally {
                btn.disabled = false;
                btn.textContent = "সদস্য যোগ করুন";
            }
        }

        function renderBooks() {
            const grid = document.getElementById('booksGrid');
            if(!grid) return;
            
            // এডমিন চেক (Case Insensitive)
            const isAdmin = currentUser && currentUser.email && currentUser.email.toLowerCase() === 'rozobali01321786059@gmail.com';
            
            grid.innerHTML = books.map(b => `
                <div class="glass-panel p-4 rounded-3xl flex flex-col h-full fade-in relative group">
                    ${isAdmin ? `
                        <button onclick="event.stopPropagation(); deleteBook('${b.id}')" class="absolute top-2 right-2 p-2 bg-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all z-20 shadow-lg">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                    <div class="aspect-[3/4] bg-slate-800 rounded-2xl mb-4 overflow-hidden">
                        ${b.coverURL ? `<img src="${b.coverURL}" class="w-full h-full object-cover" />` : '<div class="w-full h-full flex items-center justify-center italic text-xs text-slate-600">No Image</div>'}
                    </div>
                    <h4 class="font-bold text-sm truncate">${b.title}</h4>
                    <p class="text-xs text-slate-500">${b.author}</p>
                    <div class="mt-auto pt-4 flex items-center justify-between">
                        <div class={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${b.available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            ${b.available ? 'AVAILABLE' : 'BORROWED'}
                        </div>
                        ${b.available ? `<button onclick="borrowBook('${b.id}')" class="text-teal-400 hover:scale-110"><i data-lucide="plus-circle" class="w-5 h-5"></i></button>` : ''}
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
        }

        async function borrowBook(id) {
            currentBorrowBookId = id;
            document.getElementById('borrowBookModal').classList.remove('hidden');
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
        window.openIssueBookModal = openIssueBookModal;
        window.closeIssueBookModal = closeIssueBookModal;
        window.confirmIssueBook = confirmIssueBook;
        window.openAddMemberModal = openAddMemberModal;
        window.closeAddMemberModal = closeAddMemberModal;
        window.addNewMember = addNewMember;
        window.openNotifyModal = openNotifyModal;
        window.closeNotifyModal = closeNotifyModal;
        window.confirmSendNotification = confirmSendNotification;
        window.closeNotifDetailsModal = closeNotifDetailsModal;
        window.showNotificationDetails = showNotificationDetails;
        window.markAsRead = markAsRead;
        window.addNewBook = addNewBook;
        window.returnBook = returnBook;
        window.deleteBook = deleteBook;
        window.handleForgotPassword = handleForgotPassword;
        window.resetSystem = resetSystem;
        window.clearNotifications = clearNotifications;

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

