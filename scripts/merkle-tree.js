const { buildPoseidon } = require('circomlibjs');

class MerkleTree {
    constructor(levels) {
        this.levels = levels;
        this.maxLeaves = Math.pow(2, levels);
        this.leaves = new Array(this.maxLeaves).fill(0n);
        this.poseidon = null;
        this.tree = [];
    }
    
    async init() {
        this.poseidon = await buildPoseidon();
        return this;
    }
    
    // Hash function using Poseidon
    hash(left, right) {
        const hash = this.poseidon.F.toString(this.poseidon([left, right]));
        return BigInt(hash);
    }
    
    // Hash a string to get leaf value
    hashString(str) {
        const hash = this.poseidon.F.toString(this.poseidon([BigInt('0x' + Buffer.from(str).toString('hex'))]));
        return BigInt(hash);
    }
    
    // Insert a leaf (AI agent description hash)
    insertLeaf(index, value) {
        if (index >= this.maxLeaves) {
            throw new Error(`Index ${index} out of bounds (max: ${this.maxLeaves - 1})`);
        }
        this.leaves[index] = BigInt(value);
    }
    
    // Build the Merkle tree
    buildTree() {
        this.tree = [this.leaves];
        
        for (let level = 0; level < this.levels; level++) {
            const currentLevel = this.tree[level];
            const nextLevel = [];
            
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = currentLevel[i + 1] || 0n;
                nextLevel.push(this.hash(left, right));
            }
            
            this.tree.push(nextLevel);
        }
        
        return this.getRoot();
    }
    
    // Get the root hash
    getRoot() {
        if (this.tree.length === 0) {
            throw new Error('Tree not built yet. Call buildTree() first.');
        }
        return this.tree[this.tree.length - 1][0];
    }
    
    // Generate Merkle proof for a given leaf index
    getProof(index) {
        if (this.tree.length === 0) {
            throw new Error('Tree not built yet. Call buildTree() first.');
        }
        
        const siblings = [];
        const pathIndices = [];
        let currentIndex = index;
        
        for (let level = 0; level < this.levels; level++) {
            const isRightNode = currentIndex % 2 === 1;
            const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
            
            siblings.push(this.tree[level][siblingIndex] || 0n);
            pathIndices.push(isRightNode ? 1 : 0);
            
            currentIndex = Math.floor(currentIndex / 2);
        }
        
        return {
            root: this.getRoot(),
            leaf: this.leaves[index],
            siblings,
            pathIndices
        };
    }
    
    // Verify a Merkle proof
    verifyProof(proof) {
        let computedHash = proof.leaf;
        
        for (let i = 0; i < proof.siblings.length; i++) {
            const sibling = proof.siblings[i];
            const pathIndex = proof.pathIndices[i];
            
            if (pathIndex === 0) {
                // Current node is left child
                computedHash = this.hash(computedHash, sibling);
            } else {
                // Current node is right child
                computedHash = this.hash(sibling, computedHash);
            }
        }
        
        return computedHash === proof.root;
    }
    
    // Find an empty slot for non-membership proof
    findEmptySlot() {
        for (let i = 0; i < this.leaves.length; i++) {
            if (this.leaves[i] === 0n) {
                return i;
            }
        }
        return -1;
    }
    
    // Check if a value exists in the tree
    hasValue(value) {
        return this.leaves.includes(BigInt(value));
    }
    
    // Display tree structure
    display() {
        console.log('\n📊 Merkle Tree Structure:');
        console.log('Root:', this.getRoot().toString());
        console.log('\nLevels:');
        for (let i = this.tree.length - 1; i >= 0; i--) {
            console.log(`Level ${this.levels - i}:`, this.tree[i].map(n => n.toString().slice(0, 10) + '...'));
        }
    }
}

// Export for use in other scripts
module.exports = { MerkleTree };