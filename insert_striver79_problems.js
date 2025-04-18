const mongoose = require("mongoose");
const Problem = require("./models/striver79DsaSheetProblems");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

const striverDSAProblems = [
    { id: 1, title: 'Next-Permutation', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/next-permutation/', titleSlug: 'next-permutation' },
    { id: 2, title: '3Sum', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/3sum/', titleSlug: '3sum' },
    { id: 3, title: 'Maximum Subarray', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-subarray/', titleSlug: 'maximum-subarray' },
    { id: 4, title: 'Majority Element II', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/majority-element-ii/', titleSlug: 'majority-element-ii' },
    { id: 5, title: 'Subarrays with K Different Integers', solved: false, difficulty: 'Hard', url: '', titleSlug: '' },
    { id: 6, title: 'Find the Duplicate Number', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/find-the-duplicate-number/', titleSlug: 'find-the-duplicate-number' },
    { id: 7, title: 'Maximum Product Subarray', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-product-subarray/', titleSlug: 'maximum-product-subarray' },
    { id: 8, title: 'Find the Missing Number', solved: false, difficulty: 'Easy', url: '', titleSlug: '' },
    { id: 9, title: 'Search in Rotated Sorted Array II', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array-ii/', titleSlug: 'search-in-rotated-sorted-array-ii' },
    { id: 10, title: 'Find Minimum in Rotated Sorted Array', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', titleSlug: 'find-minimum-in-rotated-sorted-array' },
    { id: 11, title: 'Find Peak Element', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/find-peak-element/', titleSlug: 'find-peak-element' },
    { id: 12, title: 'Koko Eating Bananas', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/koko-eating-bananas/', titleSlug: 'koko-eating-bananas' },
    { id: 13, title: 'Aggressive Cows', solved: false, difficulty: 'Not Available on LeetCode', url: '', titleSlug: '' },
    { id: 14, title: 'Book Allocation', solved: false, difficulty: 'Not Available on LeetCode', url: '', titleSlug: '' },
    { id: 15, title: 'Median of Two Sorted Arrays', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', titleSlug: 'median-of-two-sorted-arrays' },
    { id: 16, title: 'Minimize Max Distance to Gas Station', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/minimize-max-distance-to-gas-station/', titleSlug: 'minimize-max-distance-to-gas-station' },
    { id: 17, title: 'Middle of the Linked List', solved: false, difficulty: 'Easy', url: 'https://leetcode.com/problems/middle-of-the-linked-list/', titleSlug: 'middle-of-the-linked-list' },
    { id: 18, title: 'Detect a Loop in LL', solved: false, difficulty: 'Not Available on LeetCode', url: '', titleSlug: '' },
    { id: 19, title: 'Remove Nth Node From End of List', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', titleSlug: 'remove-nth-node-from-end-of-list' },
    { id: 20, title: 'Intersection of Two Linked Lists', solved: false, difficulty: 'Easy', url: 'https://leetcode.com/problems/intersection-of-two-linked-lists/', titleSlug: 'intersection-of-two-linked-lists' },
    { id: 21, title: 'Sort List', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/sort-list/', titleSlug: 'sort-list' },
    { id: 22, title: 'Odd Even Linked List', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/odd-even-linked-list/', titleSlug: 'odd-even-linked-list' },
    { id: 23, title: 'Subsets', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/subsets/', titleSlug: 'subsets' },
    { id: 24, title: 'Combination Sum', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/combination-sum/', titleSlug: 'combination-sum' },
    { id: 25, title: 'N-Queens', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/n-queens/', titleSlug: 'n-queens' },
    { id: 26, title: 'Sudoku Solver', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/sudoku-solver/', titleSlug: 'sudoku-solver' },
    { id: 27, title: 'M Coloring Problem', solved: false, difficulty: 'Not Available on LeetCode', url: '', titleSlug: '' },
    { id: 28, title: 'Word Search', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/word-search/', titleSlug: 'word-search' },
    { id: 29, title: 'Next Greater Element I', solved: false, difficulty: 'Easy', url: 'https://leetcode.com/problems/next-greater-element-i/', titleSlug: 'next-greater-element-i' },
    { id: 30, title: 'Trapping Rain Water', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/trapping-rain-water/', titleSlug: 'trapping-rain-water' },
    { id: 31, title: 'Largest Rectangle in Histogram', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', titleSlug: 'largest-rectangle-in-histogram' },
    { id: 32, title: 'Asteroid Collision', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/asteroid-collision/', titleSlug: 'asteroid-collision' },
    { id: 33, title: 'Sliding Window Maximum', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/sliding-window-maximum/', titleSlug: 'sliding-window-maximum' },
    { id: 34, title: 'LRU Cache', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/lru-cache/', titleSlug: 'lru-cache' },
    { id: 35, title: 'Kth Largest Element in an Array', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', titleSlug: 'kth-largest-element-in-an-array' },
    { id: 36, title: 'Task Scheduler', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/task-scheduler/', titleSlug: 'task-scheduler' },
    { id: 37, title: 'Min Heap', solved: false, difficulty: 'Not Available on LeetCode', url: '', titleSlug: '' },
    { id: 38, title: 'Max Heap', solved: false, difficulty: 'Not Available on LeetCode', url: '', titleSlug: '' },
    { id: 39, title: 'Diameter of Binary Tree', solved: false, difficulty: 'Easy', url: 'https://leetcode.com/problems/diameter-of-binary-tree/', titleSlug: 'diameter-of-binary-tree' },
    { id: 40, title: 'Binary Tree Maximum Path Sum', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', titleSlug: 'binary-tree-maximum-path-sum' },
    { id: 41, title: 'Binary Tree Bottom View', solved: false, difficulty: 'Not Available on LeetCode', url: '', titleSlug: '' },
    { id: 42, title: 'Lowest Common Ancestor of a Binary Tree', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', titleSlug: 'lowest-common-ancestor-of-a-binary-tree' },
    { id: 43, title: 'Minimum Time to Burn the Binary Tree', solved: false, difficulty: 'Not Available on LeetCode', url: '', titleSlug: '' },
    { id: 44, title: 'Construct Binary Tree from Preorder and Inorder Traversal', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', titleSlug: 'construct-binary-tree-from-preorder-and-inorder-traversal' },
    { id: 45, title: 'Binary Tree Preorder Traversal', solved: false, difficulty: 'Easy', url: 'https://leetcode.com/problems/binary-tree-preorder-traversal/', titleSlug: 'binary-tree-preorder-traversal' },
    { id: 46, title: 'Delete Node in a BST', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/delete-node-in-a-bst/', titleSlug: 'delete-node-in-a-bst' },
    { id: 47, title: 'Lowest Common Ancestor of a Binary Search Tree', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', titleSlug: 'lowest-common-ancestor-of-a-binary-search-tree' },
    { id: 48, title: 'Two Sum IV - Input is a BST', solved: false, difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum-iv-input-is-a-bst/', titleSlug: 'two-sum-iv-input-is-a-bst' },
    { id: 49, title: 'Recover Binary Search Tree', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/recover-binary-search-tree/', titleSlug: 'recover-binary-search-tree' },
    { id: 50, title: 'Kth Smallest Element in a BST', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', titleSlug: 'kth-smallest-element-in-a-bst' },
    { id: 51, title: 'Serialize and Deserialize Binary Tree', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', titleSlug: 'serialize-and-deserialize-binary-tree' },
    { id: 52, title: 'Count Complete Tree Nodes', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/count-complete-tree-nodes/', titleSlug: 'count-complete-tree-nodes' },
    { id: 53, title: 'Merge Intervals', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/merge-intervals/', titleSlug: 'merge-intervals' },
    { id: 54, title: 'Insert Interval', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-interval/', titleSlug: 'insert-interval' },
    { id: 55, title: 'Insert Delete GetRandom O(1)', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/insert-delete-getrandom-o1/', titleSlug: 'insert-delete-getrandom-o1' },
    { id: 56, title: 'Implement Trie (Prefix Tree)', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/', titleSlug: 'implement-trie-prefix-tree' },
    { id: 57, title: 'Palindrome Linked List', solved: false, difficulty: 'Easy', url: 'https://leetcode.com/problems/palindrome-linked-list/', titleSlug: 'palindrome-linked-list' },
    { id: 58, title: 'Subarray Sum Equals K', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/subarray-sum-equals-k/', titleSlug: 'subarray-sum-equals-k' },
    { id: 59, title: 'Find All Anagrams in a String', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/find-all-anagrams-in-a-string/', titleSlug: 'find-all-anagrams-in-a-string' },
    { id: 60, title: 'Word Search II', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/word-search-ii/', titleSlug: 'word-search-ii' },
    { id: 61, title: 'Maximal Rectangle', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/maximal-rectangle/', titleSlug: 'maximal-rectangle' },
    { id: 62, title: 'Binary Tree Level Order Traversal II', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal-ii/', titleSlug: 'binary-tree-level-order-traversal-ii' },
    { id: 63, title: 'Product of Array Except Self', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/product-of-array-except-self/', titleSlug: 'product-of-array-except-self' },
    { id: 64, title: 'Valid Sudoku', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/valid-sudoku/', titleSlug: 'valid-sudoku' },
    { id: 65, title: 'Maximum Sum of Two Non-Overlapping Subarrays', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-sum-of-two-non-overlapping-subarrays/', titleSlug: 'maximum-sum-of-two-non-overlapping-subarrays' },
    { id: 66, title: 'Longest Consecutive Sequence', solved: false, difficulty: 'Hard', url: 'https://leetcode.com/problems/longest-consecutive-sequence/', titleSlug: 'longest-consecutive-sequence' },
    { id: 67, title: 'Maximal Square', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/maximal-square/', titleSlug: 'maximal-square' },
    { id: 68, title: 'Longest Substring Without Repeating Characters', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', titleSlug: 'longest-substring-without-repeating-characters' },
    { id: 69, title: 'Reorder List', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/reorder-list/', titleSlug: 'reorder-list' },
    { id: 70, title: 'Find All Numbers Disappeared in an Array', solved: false, difficulty: 'Easy', url: 'https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/', titleSlug: 'find-all-numbers-disappeared-in-an-array' },
    { id: 71, title: 'Set Matrix Zeroes', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/set-matrix-zeroes/', titleSlug: 'set-matrix-zeroes' },
    { id: 72, title: 'Divide and Conquer', solved: false, difficulty: 'Not Available on LeetCode', url: '', titleSlug: '' },
    { id: 73, title: 'Find Missing Number', solved: false, difficulty: 'Medium', url: 'https://leetcode.com/problems/find-missing-number/', titleSlug: 'find-missing-number' }
];

const insertProblems = async () => {
  try {
    // First, clear all existing problems
    console.log("Clearing existing problems...");
    await Problem.deleteMany({});
    console.log("Existing problems cleared.");

    // Insert new problems
    console.log("Inserting new problems...");
    await Problem.insertMany(striverDSAProblems);
    console.log("Striver DSA problems inserted successfully!");
    
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.connection.close();
  }
};

insertProblems();
