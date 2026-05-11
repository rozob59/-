# এআইডিই (AIDE) মাস্টার কোড গাইড (A to Z)

এই ফাইলটিতে আপনার লাইব্রেরী অ্যাপের প্রতিটি পেইজের কোড এবং কনফিগারেশন দেওয়া আছে। মোবাইল দিয়ে রান করার জন্য নিচের ধাপগুলো অনুসরণ করুন।

## ১. build.gradle (Dependencies)
```gradle
dependencies {
    implementation 'com.google.firebase:firebase-auth:21.0.1'
    implementation 'com.google.firebase:firebase-firestore:24.0.0'
}
```

## ২. মেইন থিম (styles.xml)
পাথ: `app/src/main/res/values/styles.xml`
```xml
<resources>
    <style name="AppTheme" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:windowBackground">#0f172a</item>
        <item name="android:colorPrimary">#0f172a</item>
    </style>
</resources>
```

## ৩. লগইন লেআউট (activity_login.xml)
পাথ: `app/src/main/res/layout/activity_login.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="32dp"
    android:background="#0f172a">

    <TextView
        android:text="লাইব্রেরী লগইন"
        android:textSize="28sp"
        android:textStyle="bold"
        android:textColor="#2dd4bf"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginBottom="40dp"/>

    <EditText
        android:id="@+id/email"
        android:hint="ইমেইল"
        android:textColorHint="#475569"
        android:textColor="#ffffff"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@android:drawable/editbox_background_normal"
        android:layout_marginBottom="16dp"/>

    <EditText
        android:id="@+id/password"
        android:hint="পাসওয়ার্ড"
        android:textColorHint="#475569"
        android:textColor="#ffffff"
        android:inputType="textPassword"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@android:drawable/editbox_background_normal"
        android:layout_marginBottom="24dp"/>

    <Button
        android:id="@+id/loginBtn"
        android:text="প্রবেশ করুন"
        android:textColor="#0f172a"
        android:background="#2dd4bf"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textStyle="bold"/>
</LinearLayout>
```

## ৪. ইউজার প্যানেল লেআউট (activity_main.xml)
পাথ: `app/src/main/res/layout/activity_main.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="#0f172a">

    <TextView
        android:text="বইয়ের তালিকা"
        android:textSize="24sp"
        android:textColor="#2dd4bf"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginBottom="16dp"/>

    <ListView
        android:id="@+id/bookList"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:divider="#1e293b"
        android:dividerHeight="1dp"/>
</LinearLayout>
```

## ৫. ফায়ারবেস কনফিগারেশন (MainActivity.java তে বসাতে হবে)
আপনার প্রজেক্টের জন্য এই তথ্যগুলো কোডে বসানো আছে:
- Project ID: `gen-lang-client-0912734577`
- API Key: `AIzaSyCzPM4Sz6uYbYUvySJiW93K0JXy4KR8dNc`

> **পরামর্শ:** ওপরের Java ফাইলগুলো (LoginActivity.java, MainActivity.java) কপি করে আপনার AIDE অ্যাপের সংশ্লিষ্ট ফাইলে বসিয়ে দিন।
