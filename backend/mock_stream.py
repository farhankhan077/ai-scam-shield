"""
mock_stream.py — Synthetic Instant Payment Transaction Generator
Generates realistic FedNow/RTP transaction data with PaySim-compatible
balance fields so the XGBoost ML model can score transactions correctly.

  - 80% safe transactions (normal behaviour, balanced accounts)
  - 20% risky transactions (fraud patterns matching PaySim fraud signatures)

PaySim Fraud Patterns replicated here:
  Pattern 1 — Account Drain (CASH_OUT): fraudster transfers entire balance out, newbalanceOrig = 0
  Pattern 2 — High Velocity TRANSFER: rapid successive transfers to empty destination accounts
  Pattern 3 — New Account Large Transfer: newly opened account immediately wires large sum
  Pattern 4 — Combined Critical (ATO): account takeover, full drain + new beneficiary
"""

import uuid
import random
from faker import Faker

fake = Faker()

SAFE_SENDER_NAMES = [
    "Alice Johnson", "Bhaskar Das", "Bob Martinez", "Carol White", "David Lee",
    "Emma Thompson", "Frank Garcia", "Grace Kim", "Henry Brown",
    "Isabella Davis", "James Wilson", "Karen Taylor", "Liam Anderson",
]

RISKY_SENDER_NAMES = [
    "Michael Chen", "Farhan Khan", "Nancy Rodriguez", "Oliver Scott", "Patricia Hall",
    "Quentin Young", "Rachel Green", "Samuel Wright", "Tina Adams",
]


def _make_account_id() -> str:
    return f"ACC-{random.randint(100000, 999999)}"


def generate_safe_transaction() -> dict:
    """
    Generate a normal, low-risk transaction (80% of stream).
    Balance fields: sender has healthy balance well above the amount.
    """
    amount          = round(random.uniform(10, 2000), 2)
    old_balance_org = round(random.uniform(amount * 3, amount * 20), 2)   # balance >> amount
    new_balance_org = round(old_balance_org - amount, 2)
    old_balance_dest = round(random.uniform(500, 50000), 2)
    new_balance_dest = round(old_balance_dest + amount, 2)

    return {
        "transaction_id":                   str(uuid.uuid4()),
        "amount":                            amount,
        "sender_name":                       random.choice(SAFE_SENDER_NAMES),
        "sender_account_id":                 _make_account_id(),
        "beneficiary_name":                  fake.name(),
        "beneficiary_bank":                  random.choice(["Chase", "BofA", "Wells Fargo", "Citi", "US Bank"]),
        "is_new_beneficiary":                False,
        "velocity_1hr":                      random.randint(1, 3),
        "time_since_account_creation_days":  random.randint(180, 1800),
        "transaction_type":                  random.choice(["P2P", "Bill Payment", "Business", "Payroll"]),
        "channel":                           random.choice(["Mobile App", "Web", "API"]),
        # PaySim-compatible balance fields
        "oldbalanceOrg":                     old_balance_org,
        "newbalanceOrig":                    new_balance_org,
        "oldbalanceDest":                    old_balance_dest,
        "newbalanceDest":                    new_balance_dest,
    }


def generate_risky_transaction() -> dict:
    """
    Generate a suspicious, high-risk transaction (20% of stream).
    Balance fields are set to match the specific PaySim fraud signatures
    the XGBoost model was trained to detect.
    """
    risk_profile = random.choice([
        "account_drain",         # Pattern 1: CASH_OUT full balance (balance_zeroed=True)
        "high_velocity",         # Pattern 2: rapid TRANSFER to empty destination
        "new_account_large",     # Pattern 3: new account, large immediate transfer
        "combined_critical",     # Pattern 4: ATO — full drain + new beneficiary
    ])

    base = {
        "transaction_id":    str(uuid.uuid4()),
        "sender_name":       random.choice(RISKY_SENDER_NAMES),
        "sender_account_id": _make_account_id(),
        "beneficiary_name":  fake.name(),
        "beneficiary_bank":  random.choice(["Chime", "CashApp Bank", "Varo", "Unknown Routing"]),
        "transaction_type":  random.choice(["P2P", "Wire", "Business"]),
        "channel":           random.choice(["Mobile App", "API"]),
    }

    if risk_profile == "account_drain":
        # Entire account balance sent out → newbalanceOrig = 0 (strongest PaySim signal)
        amount          = round(random.uniform(8000, 40000), 2)
        old_balance_org = amount + round(random.uniform(0, 500), 2)  # balance ≈ amount
        new_balance_org = 0.0                                          # account drained
        old_balance_dest = 0.0                                         # destination was empty
        new_balance_dest = amount

        base.update({
            "amount":                           amount,
            "is_new_beneficiary":               True,
            "velocity_1hr":                     random.randint(3, 8),
            "time_since_account_creation_days": random.randint(60, 500),
            "oldbalanceOrg":                    old_balance_org,
            "newbalanceOrig":                   new_balance_org,   # DRAINED
            "oldbalanceDest":                   old_balance_dest,  # empty destination
            "newbalanceDest":                   new_balance_dest,
        })

    elif risk_profile == "high_velocity":
        # High velocity rapid transfers, each draining a portion, destination starts empty
        amount          = round(random.uniform(2000, 12000), 2)
        old_balance_org = round(random.uniform(amount * 0.9, amount * 1.5), 2)
        new_balance_org = max(0.0, round(old_balance_org - amount, 2))
        balance_zeroed  = new_balance_org == 0.0
        old_balance_dest = 0.0
        new_balance_dest = amount

        base.update({
            "amount":                           amount,
            "is_new_beneficiary":               random.choice([True, False]),
            "velocity_1hr":                     random.randint(10, 25),
            "time_since_account_creation_days": random.randint(30, 300),
            "oldbalanceOrg":                    old_balance_org,
            "newbalanceOrig":                   new_balance_org,
            "oldbalanceDest":                   old_balance_dest,
            "newbalanceDest":                   new_balance_dest,
        })

    elif risk_profile == "new_account_large":
        # Newly created account immediately makes large transfer (mule account pattern)
        amount          = round(random.uniform(5000, 20000), 2)
        old_balance_org = round(random.uniform(amount * 0.95, amount * 1.1), 2)
        new_balance_org = max(0.0, round(old_balance_org - amount, 2))
        old_balance_dest = 0.0
        new_balance_dest = amount

        base.update({
            "amount":                           amount,
            "is_new_beneficiary":               True,
            "velocity_1hr":                     random.randint(1, 6),
            "time_since_account_creation_days": random.randint(1, 14),  # very new account
            "oldbalanceOrg":                    old_balance_org,
            "newbalanceOrig":                   new_balance_org,
            "oldbalanceDest":                   old_balance_dest,  # empty destination
            "newbalanceDest":                   new_balance_dest,
        })

    else:  # combined_critical — Account Takeover worst case
        # ATO: large amount, account fully drained, new empty beneficiary, high velocity
        amount          = round(random.uniform(20000, 80000), 2)
        old_balance_org = amount + round(random.uniform(0, 200), 2)
        new_balance_org = 0.0   # completely drained
        old_balance_dest = 0.0  # destination never had money
        new_balance_dest = amount

        base.update({
            "amount":                           amount,
            "is_new_beneficiary":               True,
            "velocity_1hr":                     random.randint(12, 25),
            "time_since_account_creation_days": random.randint(1, 7),
            "oldbalanceOrg":                    old_balance_org,
            "newbalanceOrig":                   new_balance_org,  # DRAINED
            "oldbalanceDest":                   old_balance_dest, # empty destination
            "newbalanceDest":                   new_balance_dest,
        })

    return base


def generate_transaction() -> dict:
    """Generate one transaction: 80% safe, 20% risky."""
    if random.random() < 0.80:
        return generate_safe_transaction()
    else:
        return generate_risky_transaction()
