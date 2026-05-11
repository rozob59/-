# এআইডিই (AIDE) অ্যাপের জন্য পূর্ণাঙ্গ কোড গাইড

আপনার এআইডিই (AIDE) অ্যাপে কোনো এরর ছাড়া কোডগুলো বসানোর জন্য নিচের স্টেপগুলো অনুসরণ করুন। মনে রাখবেন, **ফাইলের নামের বানান এবং হাতের লেখা (বড়/ছোট অক্ষর) হুবহু এক হতে হবে।**

### ১. মডেল ক্লাস (File: Book.java)
**সতর্কতা:** ফাইলের নাম অবশ্যই `Book.java` হতে হবে (B বড় হাতের)।
পাথ: `app/src/main/java/com/gobdha/library/Book.java`

```java
package com.gobdha.library;

public class Book {
    public String title;
    public String author;

    public Book() {} 

    public Book(String title, String author) {
        this.title = title;
        this.author = author;
    }
}
```

### ২. লগইন অ্যাক্টিভিটি (File: LoginActivity.java)
পাথ: `app/src/main/java/com/gobdha/library/LoginActivity.java`

```java
package com.gobdha.library;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

public class LoginActivity extends Activity {
    private EditText emailField, passwordField;
    private Button loginButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        emailField = findViewById(R.id.email);
        passwordField = findViewById(R.id.password);
        loginButton = findViewById(R.id.loginBtn);

        loginButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String email = emailField.getText().toString();
                String pass = passwordField.getText().toString();
                
                // এখানে সিম্পল লগইন চেক (ফায়ারবেস অথেন্টিকেশন কোড পরে যোগ করা যাবে)
                if(email.equals("admin") && pass.equals("1234")) {
                    startActivity(new Intent(LoginActivity.this, MainActivity.class));
                    finish();
                } else {
                    Toast.makeText(LoginActivity.this, "ভুল ইমেইল বা পাসওয়ার্ড", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }
}
```

### ৩. লগইন লেআউট (File: activity_login.xml)
পাথ: `app/src/main/res/layout/activity_login.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="20dp"
    android:gravity="center"
    android:background="#FFFFFF">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="লগইন করুন"
        android:textSize="24sp"
        android:textStyle="bold"
        android:textColor="#2D3748"
        android:layout_marginBottom="30dp"/>

    <EditText
        android:id="@+id/email"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="ইমেইল"
        android:inputType="textEmailAddress"
        android:layout_marginBottom="10dp"/>

    <EditText
        android:id="@+id/password"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="পাসওয়ার্ড"
        android:inputType="textPassword"
        android:layout_marginBottom="20dp"/>

    <Button
        android:id="@+id/loginBtn"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="প্রবেশ করুন"
        android:background="#2DD4BF"
        android:textColor="#FFFFFF"/>
</LinearLayout>
```

### ৪. মেইন অ্যাক্টিভিটি (File: MainActivity.java)
পাথ: `app/src/main/java/com/gobdha/library/MainActivity.java`

```java
package com.gobdha.library;

import android.os.Bundle;
import android.app.Activity;
import android.widget.ArrayAdapter;
import android.widget.ListView;
import java.util.ArrayList;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        ListView listView = (ListView) findViewById(R.id.bookList);
        
        ArrayList<String> books = new ArrayList<>();
        books.add("বই ১: পথের পাঁচালী - বিভূতিভূষণ");
        books.add("বই ২: হিমু - হুমায়ূন আহমেদ");
        books.add("বই ৩: আগুনের পরশমণি - হুমায়ূন আহমেদ");
        books.add("বই ৪: বিষাদ সিন্ধু - মীর মোশাররফ হোসেন");
        
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
            this, 
            android.R.layout.simple_list_item_1, 
            books
        );
        
        listView.setAdapter(adapter);
    }
}
```

### ৫. মেইন লেআউট (File: activity_main.xml)
পাথ: `app/src/main/res/layout/activity_main.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="#F7FAFC">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="বইয়ের তালিকা"
        android:textSize="22sp"
        android:textStyle="bold"
        android:textColor="#2D3748"
        android:layout_marginBottom="20dp"/>

    <ListView
        android:id="@+id/bookList"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:divider="#E2E8F0"
        android:dividerHeight="1dp"/>
</LinearLayout>
```

### কেন এরর আসছে? সমাধান:

১. **Book.java:** আপনার এরর মেসেজে দেখা যাচ্ছে আপনি ফাইল সেভ করেছেন `book.java` (ছোট হাতের b) নামে, কিন্তু ক্লাসের নাম দিয়েছেন `public class Book` (বড় হাতের B)। জাভাতে ক্লাসের নাম এবং ফাইলের নাম হুবহু এক হতে হয়। ফাইলটিকে রিনেম করে **Book.java** করুন।
২. **MainActivity.java:** `R.layout.activity_main` এরর আসার কারণ হতে পারে এক্সএমএল (Layout) ফাইলটি ঠিকমতো তৈরি হয়নি বা স্পেলিং ভুল। উপরে দেওয়া `activity_main.xml` কোডটি ভালো করে চেক করুন।

### জিপ ফাইল কিভাবে পাবেন?
১. এই উইন্ডোর উপরে গিয়ার (Settings) আইকনে ক্লিক করুন।
২. **Export to ZIP** বাটনে ক্লিক করুন।
৩. পুরো প্রজেক্টটি ডাউনলোড হয়ে যাবে, যার ভেতর এই গাইড ফাইলটিও থাকবে।
