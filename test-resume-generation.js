/**
 * Test script for updated resume generation system
 */

const ResumeGenerator = require('./src/modules/resume-generator');

async function testUpdatedResumeGeneration() {
  try {
    console.log('🧪 Testing Updated Resume Generation System');
    console.log('==========================================');
    
    const generator = new ResumeGenerator();
    
    // Test job data for SEO position
    const testJob = {
      id: 'test-seo-updated',
      title: 'Senior SEO Specialist',
      company: 'Test Company Inc.',
      description: 'We are looking for an experienced SEO specialist with expertise in Elasticsearch, technical SEO, Google Analytics, and content optimization. Must have experience with enterprise search solutions and 5+ years of SEO experience.'
    };
    
    console.log('\n📋 Test Job Details:');
    console.log(`   • Title: ${testJob.title}`);
    console.log(`   • Company: ${testJob.company}`);
    console.log(`   • Description: ${testJob.description.substring(0, 100)}...`);
    
    console.log('\n🔄 Generating customized resume...');
    const result = await generator.generateResumeForJob(testJob);
    
    if (result.success) {
      console.log('\n✅ RESUME GENERATION SUCCESSFUL!');
      console.log(`   • Match Score: ${result.matchScore}%`);
      console.log(`   • Resume Path: ${result.resumePath}`);
      console.log(`   • Customization Level: ${result.metadata.customizations.level}`);
      console.log(`   • Primary Skills: ${result.metadata.customizations.primarySkills.join(', ')}`);
      console.log(`   • Focus Areas: ${result.metadata.customizations.focusAreas.join(', ')}`);
      
      console.log('\n📄 Generated Files:');
      console.log(`   • PDF: ${result.resumePath}`);
      console.log(`   • JSON: ${result.metadata.filePaths.json}`);
      
      // Test date formatting
      console.log('\n📅 Date Formatting Test:');
      console.log(`   • "2024-01" → "${generator.formatDateForDisplay('2024-01')}"`);
      console.log(`   • "2023-09" → "${generator.formatDateForDisplay('2023-09')}"`);
      console.log(`   • "Present" → "${generator.formatDateForDisplay('Present')}"`);
      console.log(`   • "Jan 2024" → "${generator.formatDateForDisplay('Jan 2024')}"`);
      
    } else {
      console.log('\n❌ RESUME GENERATION FAILED');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testUpdatedResumeGeneration();
