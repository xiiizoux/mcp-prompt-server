import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';
import YAML from 'yaml';

// Functions and variables to test from src/index.ts
import {
  handleReloadPrompts,
  handleUpdatePrompt,
  handleDeletePrompt,
  reloadServerAndTools,
  getLoadedPrompts,
  PROMPTS_DIR,
  UpdatePromptSchema, // For constructing valid input
  DeletePromptSchema, // For constructing valid input
} from '../src/index.js';

// Helper function to create a dummy prompt file
async function createDummyPromptFile(name, content) {
  const filePath = path.join(PROMPTS_DIR, name);
  await fs.ensureDir(PROMPTS_DIR); // Ensure the prompts directory exists
  if (name.endsWith('.json')) {
    await fs.writeJson(filePath, content);
  } else {
    await fs.writeFile(filePath, YAML.stringify(content));
  }
  return filePath;
}

// List of files created during tests for cleanup
const testFilesCreated = [];

async function cleanupTestFiles() {
  for (const file of testFilesCreated) {
    try {
      await fs.remove(file);
    } catch (err) {
      console.error(`Error cleaning up file ${file}:`, err);
    }
  }
  testFilesCreated.length = 0; // Clear the array
}

// Test suite
async function runTests() {
  try {
    console.log('Starting management tools tests...');

    // Initial reload to ensure a clean state for loadedPrompts for some tests
    // Note: In a real test runner, this would be in a beforeAll or beforeEach
    await reloadServerAndTools(); 

    // --- Test `update_prompt` ---
    console.log('Testing update_prompt...');
    // Scenario 1: Successful Update
    const updatePromptName = 'test_update_me.yaml';
    const updateFilePath = await createDummyPromptFile(updatePromptName, {
      name: 'test_update_me',
      description: 'Initial description',
      messages: [{ role: 'user', content: { text: 'Hello' } }],
    });
    testFilesCreated.push(updateFilePath);
    await reloadServerAndTools(); // Load it initially

    let initialLoadedUpdatePrompt = getLoadedPrompts().find(p => p.name === 'test_update_me');
    assert(initialLoadedUpdatePrompt, 'test_update_me should be loaded initially');
    assert.strictEqual(initialLoadedUpdatePrompt.description, 'Initial description', 'Initial description mismatch');

    const updateArgs = {
      name: 'test_update_me',
      description: 'Updated description',
      // arguments and messages can be omitted if schema allows optional
    };
    // Validate with Zod schema before passing to handler
    const parsedUpdateArgs = UpdatePromptSchema.parse(updateArgs); 
    const updateResult = await handleUpdatePrompt(parsedUpdateArgs, {});
    
    assert(!updateResult.isError, `update_prompt success failed: ${updateResult.content[0].text}`);
    assert(updateResult.content[0].text.includes('updated and server reloaded'), 'Success message incorrect for update');

    const updatedFileContent = YAML.parse(await fs.readFile(updateFilePath, 'utf8'));
    assert.strictEqual(updatedFileContent.description, 'Updated description', 'File content not updated');

    const reloadedUpdatePrompt = getLoadedPrompts().find(p => p.name === 'test_update_me');
    assert(reloadedUpdatePrompt, 'test_update_me should still be loaded');
    assert.strictEqual(reloadedUpdatePrompt.description, 'Updated description', 'loadedPrompts not updated');
    console.log('update_prompt success: PASSED');

    // Scenario 2: Update Non-Existent Prompt
    const nonExistentUpdateArgs = { name: 'non_existent_prompt_update' };
    const parsedNonExistentUpdateArgs = UpdatePromptSchema.parse(nonExistentUpdateArgs);
    const updateNonExistentResult = await handleUpdatePrompt(parsedNonExistentUpdateArgs, {});
    assert(updateNonExistentResult.isError, 'update_prompt non-existent should be an error');
    assert(updateNonExistentResult.content[0].text.includes('not found'), 'Error message incorrect for non-existent update');
    console.log('update_prompt non-existent: PASSED');

    // --- Test `delete_prompt` ---
    console.log('Testing delete_prompt...');
    // Scenario 1: Successful Deletion
    const deletePromptName = 'test_delete_me.yaml';
    const deleteFilePath = await createDummyPromptFile(deletePromptName, { name: 'test_delete_me', description: 'To be deleted' });
    testFilesCreated.push(deleteFilePath); // Add to cleanup, though it will be deleted by the test
    await reloadServerAndTools(); // Load it

    assert(getLoadedPrompts().some(p => p.name === 'test_delete_me'), 'test_delete_me should be loaded before delete');
    
    const deleteArgs = { name: 'test_delete_me' };
    const parsedDeleteArgs = DeletePromptSchema.parse(deleteArgs);
    const deleteResult = await handleDeletePrompt(parsedDeleteArgs, {});

    assert(!deleteResult.isError, `delete_prompt success failed: ${deleteResult.content[0].text}`);
    assert(deleteResult.content[0].text.includes('deleted and server reloaded'), 'Success message incorrect for delete');
    
    assert(!(await fs.pathExists(deleteFilePath)), 'File not deleted');
    assert(!getLoadedPrompts().some(p => p.name === 'test_delete_me'), 'loadedPrompts still contains deleted prompt');
    console.log('delete_prompt success: PASSED');
    
    // Scenario 2: Delete Non-Existent Prompt
    const nonExistentDeleteArgs = { name: 'non_existent_prompt_delete' };
    const parsedNonExistentDeleteArgs = DeletePromptSchema.parse(nonExistentDeleteArgs);
    const deleteNonExistentResult = await handleDeletePrompt(parsedNonExistentDeleteArgs, {});
    assert(deleteNonExistentResult.isError, 'delete_prompt non-existent should be an error');
    assert(deleteNonExistentResult.content[0].text.includes('not found'), 'Error message incorrect for non-existent delete');
    console.log('delete_prompt non-existent: PASSED');

    // --- Test `reload_prompts` (and `reloadServerAndTools` implicitly) ---
    console.log('Testing reload_prompts...');
    const reloadPromptNameA = 'test_reload_A.yaml';
    const reloadPromptNameB = 'test_reload_B.json';

    const reloadFilePathA = await createDummyPromptFile(reloadPromptNameA, { name: 'test_reload_A', description: 'Prompt A' });
    testFilesCreated.push(reloadFilePathA);
    await reloadServerAndTools();
    assert(getLoadedPrompts().some(p => p.name === 'test_reload_A'), 'Prompt A should be loaded initially');
    assert(!getLoadedPrompts().some(p => p.name === 'test_reload_B'), 'Prompt B should not be loaded initially');

    const reloadFilePathB = await createDummyPromptFile(reloadPromptNameB, { name: 'test_reload_B', description: 'Prompt B' });
    testFilesCreated.push(reloadFilePathB);
    await fs.remove(reloadFilePathA); // Manually delete A

    const reloadResult = await handleReloadPrompts({}, {});
    assert(!reloadResult.isError, `reload_prompts failed: ${reloadResult.content[0].text}`);
    assert(reloadResult.content[0].text.includes('reloaded successfully'), 'Success message incorrect for reload');
    
    const finalPrompts = getLoadedPrompts();
    assert(!finalPrompts.some(p => p.name === 'test_reload_A'), 'Prompt A should not be in final loaded prompts');
    assert(finalPrompts.some(p => p.name === 'test_reload_B'), 'Prompt B should be in final loaded prompts');
    console.log('reload_prompts: PASSED');

    console.log('All management tools tests PASSED!');

  } catch (error) {
    console.error('Test suite FAILED:', error);
  } finally {
    await cleanupTestFiles();
    console.log('Test cleanup finished.');
  }
}

runTests();
