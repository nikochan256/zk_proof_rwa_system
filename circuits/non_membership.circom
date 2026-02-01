pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// Merkle tree non-membership proof circuit
// Proves that a given AI agent description hash is NOT in the Merkle tree
template MerkleNonMembership(levels) {
    // Public inputs
    signal input root;                    // Merkle tree root (public)
    signal input agentDescriptionHash;    // Hash of AI agent description to check (public)
    
    // Private inputs
    signal input siblings[levels];        // Merkle proof siblings (private)
    signal input pathIndices[levels];     // Path in tree (0 = left, 1 = right) (private)
    signal input leafHash;                // Hash at the claimed position (private)
    
    // Outputs
    signal output isNonMember;            // 1 if non-member, 0 if member
    
    // Step 1: Verify the Merkle proof for the claimed position
    signal computedHash[levels + 1];
    computedHash[0] <== leafHash;
    
    component poseidons[levels];
    component selectors[levels];
    
    for (var i = 0; i < levels; i++) {
        // Select correct order based on path index
        selectors[i] = Selector();
        selectors[i].in[0] <== computedHash[i];
        selectors[i].in[1] <== siblings[i];
        selectors[i].s <== pathIndices[i];
        
        // Hash the pair using Poseidon
        poseidons[i] = Poseidon(2);
        poseidons[i].inputs[0] <== selectors[i].out[0];
        poseidons[i].inputs[1] <== selectors[i].out[1];
        
        computedHash[i + 1] <== poseidons[i].out;
    }
    
    // Step 2: Verify computed root matches the public root
    component rootCheck = IsEqual();
    rootCheck.in[0] <== computedHash[levels];
    rootCheck.in[1] <== root;
    rootCheck.out === 1; // Constraint: roots must match
    
    // Step 3: Verify the leaf hash is different from agentDescriptionHash
    component nonMemberCheck = IsEqual();
    nonMemberCheck.in[0] <== leafHash;
    nonMemberCheck.in[1] <== agentDescriptionHash;
    
    // Output 1 if different (non-member), 0 if same (member)
    isNonMember <== 1 - nonMemberCheck.out;
}

// Helper template: selects left or right based on path index
template Selector() {
    signal input in[2];
    signal input s;
    signal output out[2];
    
    // If s = 0: out[0] = in[0], out[1] = in[1] (left path)
    // If s = 1: out[0] = in[1], out[1] = in[0] (right path)
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

// Main component with tree depth of 8 (256 leaves max)
component main {public [root, agentDescriptionHash]} = MerkleNonMembership(8);
