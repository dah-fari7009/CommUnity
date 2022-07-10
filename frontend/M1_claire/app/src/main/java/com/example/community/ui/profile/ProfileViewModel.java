package com.example.community.ui.profile;

import android.app.Application;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.JsonArrayRequest;
import com.android.volley.toolbox.Volley;
import com.example.community.classes.UserWithScore;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;

public class ProfileViewModel extends AndroidViewModel {

    private static final String TAG = "PROFILE_VIEW_MODEL";
    private final MutableLiveData<ArrayList<String>> mText;
    private final Application application;

    public ProfileViewModel(@NonNull Application application) {
        super(application);
        this.application = application;
        this.mText = new MutableLiveData<>(new ArrayList<>());
//        fetchRestrictions();
    }

    public LiveData<ArrayList<String>> getRestrictions() {
        return mText;
    }

//    private void fetchRestrictions() {
//        RequestQueue queue = Volley.newRequestQueue(this.application);
//        String url = "http://10.0.2.2:8080/rank/top/10";
//
//        JsonArrayRequest request = new JsonArrayRequest(Request.Method.GET,
//                url,
//                null,
//                (JSONArray response) -> {
//                    Log.d(TAG, "fetchLeaderboard: " + response);
//                    ArrayList<UserWithScore> users = new ArrayList<>();
//                    if (response != null) {
//                        for (int i = 0; i < response.length(); i++) {
//                            try {
//                                UserWithScore currUser = new UserWithScore(response.getJSONObject(i));
//                                users.add(currUser);
//                            } catch (JSONException e) {
//                                e.printStackTrace();
//                            }
//                        }
//                    }
//                    mList.setValue(users);
//                },
//                error -> {
//                    Log.e(TAG, "fetchLeaderboard: " + error);
////                    callback.onError(error);
//                });
//        queue.add(request);
//    }
}