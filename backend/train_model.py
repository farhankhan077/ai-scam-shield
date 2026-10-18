"""
train_model.py -- XGBoost Fraud Detection Model Trainer
======================================================
Trains on the real-world PaySim Kaggle dataset.
Dataset: https://www.kaggle.com/datasets/ealaxi/paysim1
Place CSV at: backend/data/paysim.csv

Run once: python train_model.py
Output:   backend/fraud_model.pkl
          backend/model_metadata.json
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import json
import os
import warnings

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

# --- Try XGBoost, fall back to RandomForest ---
try:
    from xgboost import XGBClassifier
    USE_XGB = True
    print("[OK] XGBoost available -- using XGBClassifier")
except ImportError:
    from sklearn.ensemble import RandomForestClassifier
    USE_XGB = False
    print("[WARN] XGBoost not found -- falling back to RandomForestClassifier")

# --- Config ---
DATA_PATH    = os.path.join(os.path.dirname(__file__), "data", "paysim.csv")
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "fraud_model.pkl")
META_PATH    = os.path.join(os.path.dirname(__file__), "model_metadata.json")

# --- Step 1: Load Data ---
print("\n[1/9] Loading PaySim dataset...")
df = pd.read_csv(DATA_PATH)
print(f"      Total rows: {len(df):,}")
print(f"      Fraud rows: {df['isFraud'].sum():,} ({df['isFraud'].mean()*100:.3f}%)")
print(f"      Columns:    {df.columns.tolist()}")

# --- Step 2: Filter to fraud-prone transaction types ---
print("\n[2/9] Filtering to TRANSFER + CASH_OUT transaction types...")
df = df[df["type"].isin(["TRANSFER", "CASH_OUT"])].copy()
print(f"      Rows after filter: {len(df):,}")
print(f"      Fraud in filtered set: {df['isFraud'].sum():,} ({df['isFraud'].mean()*100:.3f}%)")

# --- Step 3: Feature Engineering ---
print("\n[3/9] Engineering features...")

le_type = LabelEncoder()
df["type_encoded"] = le_type.fit_transform(df["type"])

df["log_amount"] = np.log1p(df["amount"])
df["balance_diff_orig"] = df["newbalanceOrig"] - df["oldbalanceOrg"]
df["balance_diff_dest"] = df["newbalanceDest"] - df["oldbalanceDest"]
df["balance_zeroed"] = ((df["newbalanceOrig"] == 0) & (df["oldbalanceOrg"] > 0)).astype(int)
df["dest_was_empty"] = (df["oldbalanceDest"] == 0).astype(int)
df["amount_to_balance_ratio"] = df["amount"] / (df["oldbalanceOrg"] + 1)

# --- Step 4: Define Feature Set ---
FEATURES = [
    "log_amount",
    "type_encoded",
    "balance_diff_orig",
    "balance_diff_dest",
    "balance_zeroed",
    "dest_was_empty",
    "amount_to_balance_ratio",
]
TARGET = "isFraud"

X = df[FEATURES].fillna(0)
y = df[TARGET]

print(f"      Feature set: {FEATURES}")
print(f"      X shape: {X.shape}")
print(f"      Class dist: {y.value_counts().to_dict()}")

# --- Step 5: Train/Test Split ---
print("\n[4/9] Splitting data (80/20 stratified)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"      Train: {len(X_train):,} | Test: {len(X_test):,}")

# --- Step 6: SMOTE ---
print("\n[5/9] Applying SMOTE to balance training classes...")
smote = SMOTE(random_state=42, sampling_strategy=0.3)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
print(f"      After SMOTE -- Train shape: {X_train_res.shape}")
print(f"      Class dist: {dict(zip(*np.unique(y_train_res, return_counts=True)))}")

# --- Step 7: Train Model ---
print("\n[6/9] Training model (this may take 1-3 minutes)...")

if USE_XGB:
    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=1,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
        verbosity=1,
    )
else:
    from sklearn.ensemble import RandomForestClassifier
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

model.fit(X_train_res, y_train_res)
print("      Model trained successfully!")

# --- Step 8: Evaluate ---
print("\n[7/9] Evaluating on held-out test set...")
y_pred       = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)[:, 1]

accuracy  = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall    = recall_score(y_test, y_pred)
f1        = f1_score(y_test, y_pred)
roc_auc   = roc_auc_score(y_test, y_pred_proba)
cm        = confusion_matrix(y_test, y_pred)

print(f"\n{'='*55}")
print(f"  EVALUATION RESULTS")
print(f"{'='*55}")
print(f"  Accuracy  : {accuracy:.4f}  ({accuracy*100:.2f}%)")
print(f"  Precision : {precision:.4f}  ({precision*100:.2f}%)")
print(f"  Recall    : {recall:.4f}  ({recall*100:.2f}%)")
print(f"  F1 Score  : {f1:.4f}")
print(f"  ROC-AUC   : {roc_auc:.4f}")
print(f"\n  Confusion Matrix:")
print(f"              Predicted")
print(f"              Legit    Fraud")
print(f"  Actual Legit  TN={cm[0,0]:>8,}  FP={cm[0,1]:>6,}")
print(f"  Actual Fraud  FN={cm[1,0]:>8,}  TP={cm[1,1]:>6,}")
print(f"\n  Full Classification Report:")
print(classification_report(y_test, y_pred, target_names=["Legit", "Fraud"]))
print(f"{'='*55}")

# --- Feature importances ---
feat_importance = dict(zip(FEATURES, model.feature_importances_.tolist()))
feat_importance_sorted = dict(sorted(feat_importance.items(), key=lambda x: x[1], reverse=True))
print("\n[8/9] Feature Importances:")
for feat, imp in feat_importance_sorted.items():
    bar = "#" * int(imp * 40)
    print(f"  {feat:<30} {imp:.4f}  {bar}")

# --- Step 9: Save ---
print(f"\n[9/9] Saving model to {MODEL_PATH}...")
model_artifact = {
    "model": model,
    "label_encoder_type": le_type,
    "feature_names": FEATURES,
}
joblib.dump(model_artifact, MODEL_PATH)

metadata = {
    "model_type": "XGBoostClassifier" if USE_XGB else "RandomForestClassifier",
    "features": FEATURES,
    "training_rows": int(len(X_train_res)),
    "test_accuracy": round(accuracy, 4),
    "test_precision": round(precision, 4),
    "test_recall": round(recall, 4),
    "test_f1": round(f1, 4),
    "test_roc_auc": round(roc_auc, 4),
    "feature_importances": feat_importance_sorted,
    "type_encoder_classes": le_type.classes_.tolist(),
    "transaction_type_mapping": {
        "P2P": "TRANSFER", "Wire": "TRANSFER", "Business": "TRANSFER",
        "Payroll": "CASH_OUT", "Bill Payment": "CASH_OUT",
        "TRANSFER": "TRANSFER", "CASH_OUT": "CASH_OUT",
    }
}
with open(META_PATH, "w") as f:
    json.dump(metadata, f, indent=2)

print(f"\n[DONE] Model saved:    {MODEL_PATH}")
print(f"[DONE] Metadata saved: {META_PATH}")
print(f"\n*** Training complete! Restart the backend server to activate the ML model. ***")
