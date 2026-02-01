#!/usr/bin/env ts-node

/**
 * Production Validation Script for ProjectForge
 * 
 * This script validates all the production-grade fixes implemented:
 * 1. Auth-aware routing
 * 2. Network stability & reliability
 * 3. Mobile responsiveness
 * 4. System-wide UX polish
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
}

class ProductionValidator {
  private results: ValidationResult[] = [];

  private log(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string) {
    this.results.push({ category, test, status, message });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} [${category}] ${test}: ${message}`);
  }

  private checkFileExists(filePath: string): boolean {
    return fs.existsSync(path.join(process.cwd(), filePath));
  }

  private checkFileContains(filePath: string, searchString: string): boolean {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
      return content.includes(searchString);
    } catch {
      return false;
    }
  }

  // 1. AUTH-AWARE ROUTING VALIDATION
  validateAuthRouting() {
    console.log('\n🔐 Validating Auth-Aware Routing...\n');

    // Check auth routing utilities exist
    if (this.checkFileExists('lib/auth-routing.ts')) {
      this.log('Auth Routing', 'Auth utilities file', 'PASS', 'lib/auth-routing.ts exists');
    } else {
      this.log('Auth Routing', 'Auth utilities file', 'FAIL', 'lib/auth-routing.ts missing');
    }

    // Check AuthAwareButton implementation
    if (this.checkFileContains('lib/auth-routing.ts', 'AuthAwareButton')) {
      this.log('Auth Routing', 'AuthAwareButton component', 'PASS', 'AuthAwareButton implemented');
    } else {
      this.log('Auth Routing', 'AuthAwareButton component', 'FAIL', 'AuthAwareButton not found');
    }

    // Check redirect handling in auth context
    if (this.checkFileContains('contexts/AuthContext.tsx', 'redirect=')) {
      this.log('Auth Routing', 'Redirect parameter handling', 'PASS', 'Redirect handling implemented');
    } else {
      this.log('Auth Routing', 'Redirect parameter handling', 'FAIL', 'Redirect handling missing');
    }

    // Check how-it-works page uses AuthAwareButton
    if (this.checkFileContains('app/how-it-works/page.tsx', 'AuthAwareButton')) {
      this.log('Auth Routing', 'Browse Templates button', 'PASS', 'AuthAwareButton used in how-it-works');
    } else {
      this.log('Auth Routing', 'Browse Templates button', 'FAIL', 'AuthAwareButton not used');
    }

    // Check auth pages handle redirects
    if (this.checkFileContains('app/auth/sign-in/page.tsx', 'redirect')) {
      this.log('Auth Routing', 'Sign-in redirect handling', 'PASS', 'Sign-in handles redirects');
    } else {
      this.log('Auth Routing', 'Sign-in redirect handling', 'FAIL', 'Sign-in redirect missing');
    }
  }

  // 2. NETWORK STABILITY VALIDATION
  validateNetworkStability() {
    console.log('\n🌐 Validating Network Stability & Reliability...\n');

    // Check enhanced network utilities
    if (this.checkFileExists('lib/network-utils.ts')) {
      this.log('Network', 'Network utilities file', 'PASS', 'lib/network-utils.ts exists');
    } else {
      this.log('Network', 'Network utilities file', 'FAIL', 'lib/network-utils.ts missing');
    }

    // Check retry logic implementation
    if (this.checkFileContains('lib/network-utils.ts', 'exponentialDelay')) {
      this.log('Network', 'Exponential backoff', 'PASS', 'Exponential backoff implemented');
    } else {
      this.log('Network', 'Exponential backoff', 'FAIL', 'Exponential backoff missing');
    }

    // Check connection monitoring
    if (this.checkFileContains('lib/network-utils.ts', 'ConnectionMonitor')) {
      this.log('Network', 'Connection monitoring', 'PASS', 'ConnectionMonitor class exists');
    } else {
      this.log('Network', 'Connection monitoring', 'FAIL', 'ConnectionMonitor missing');
    }

    // Check network-aware options
    if (this.checkFileContains('lib/network-utils.ts', 'getNetworkAwareOptions')) {
      this.log('Network', 'Network-aware options', 'PASS', 'Network-aware options implemented');
    } else {
      this.log('Network', 'Network-aware options', 'FAIL', 'Network-aware options missing');
    }

    // Check authenticated fetch enhancements
    if (this.checkFileContains('lib/network-utils.ts', 'X-Connection-Quality')) {
      this.log('Network', 'Connection quality headers', 'PASS', 'Connection quality headers added');
    } else {
      this.log('Network', 'Connection quality headers', 'FAIL', 'Connection quality headers missing');
    }

    // Check optimistic updates
    if (this.checkFileContains('lib/network-utils.ts', 'OptimisticUpdater')) {
      this.log('Network', 'Optimistic updates', 'PASS', 'OptimisticUpdater implemented');
    } else {
      this.log('Network', 'Optimistic updates', 'FAIL', 'OptimisticUpdater missing');
    }

    // Check enhanced health endpoint
    if (this.checkFileContains('app/api/health/route.ts', 'responseTime')) {
      this.log('Network', 'Enhanced health check', 'PASS', 'Health endpoint enhanced');
    } else {
      this.log('Network', 'Enhanced health check', 'FAIL', 'Health endpoint not enhanced');
    }
  }

  // 3. MOBILE RESPONSIVENESS VALIDATION
  validateMobileResponsiveness() {
    console.log('\n📱 Validating Mobile Responsiveness...\n');

    // Check enhanced mobile hooks
    if (this.checkFileContains('hooks/use-mobile.ts', 'useScreenSize')) {
      this.log('Mobile', 'Enhanced mobile hooks', 'PASS', 'useScreenSize hook implemented');
    } else {
      this.log('Mobile', 'Enhanced mobile hooks', 'FAIL', 'useScreenSize hook missing');
    }

    // Check dashboard mobile responsiveness
    if (this.checkFileContains('app/dashboard/page.tsx', 'sm:grid-cols-2')) {
      this.log('Mobile', 'Dashboard responsive grid', 'PASS', 'Dashboard uses responsive grid');
    } else {
      this.log('Mobile', 'Dashboard responsive grid', 'FAIL', 'Dashboard grid not responsive');
    }

    // Check sidebar mobile responsiveness
    if (this.checkFileContains('components/dashboard-sidebar.tsx', 'isMobile')) {
      this.log('Mobile', 'Sidebar mobile adaptation', 'PASS', 'Sidebar adapts to mobile');
    } else {
      this.log('Mobile', 'Sidebar mobile adaptation', 'FAIL', 'Sidebar not mobile-adapted');
    }

    // Check how-it-works mobile responsiveness
    if (this.checkFileContains('app/how-it-works/page.tsx', 'sm:text-4xl')) {
      this.log('Mobile', 'How-it-works responsive text', 'PASS', 'How-it-works uses responsive text');
    } else {
      this.log('Mobile', 'How-it-works responsive text', 'FAIL', 'How-it-works text not responsive');
    }

    // Check auth pages mobile responsiveness
    if (this.checkFileContains('app/auth/sign-in/page.tsx', 'h-10 sm:h-11')) {
      this.log('Mobile', 'Auth forms responsive inputs', 'PASS', 'Auth forms use responsive inputs');
    } else {
      this.log('Mobile', 'Auth forms responsive inputs', 'FAIL', 'Auth forms not responsive');
    }

    // Check manifest.json for PWA
    if (this.checkFileExists('public/manifest.json')) {
      this.log('Mobile', 'PWA manifest', 'PASS', 'PWA manifest exists');
    } else {
      this.log('Mobile', 'PWA manifest', 'FAIL', 'PWA manifest missing');
    }

    // Check viewport meta tag
    if (this.checkFileContains('app/layout.tsx', 'viewport:')) {
      this.log('Mobile', 'Viewport meta tag', 'PASS', 'Viewport meta tag configured');
    } else {
      this.log('Mobile', 'Viewport meta tag', 'FAIL', 'Viewport meta tag missing');
    }
  }

  // 4. UX POLISH VALIDATION
  validateUXPolish() {
    console.log('\n✨ Validating System-wide UX Polish...\n');

    // Check error boundary implementation
    if (this.checkFileExists('components/error-boundary.tsx')) {
      this.log('UX Polish', 'Error boundary component', 'PASS', 'Error boundary implemented');
    } else {
      this.log('UX Polish', 'Error boundary component', 'FAIL', 'Error boundary missing');
    }

    // Check loading states
    if (this.checkFileExists('components/loading-states.tsx')) {
      this.log('UX Polish', 'Loading states component', 'PASS', 'Loading states implemented');
    } else {
      this.log('UX Polish', 'Loading states component', 'FAIL', 'Loading states missing');
    }

    // Check toast utilities
    if (this.checkFileExists('lib/toast-utils.ts')) {
      this.log('UX Polish', 'Toast utilities', 'PASS', 'Enhanced toast system implemented');
    } else {
      this.log('UX Polish', 'Toast utilities', 'FAIL', 'Toast utilities missing');
    }

    // Check theme provider in layout
    if (this.checkFileContains('app/layout.tsx', 'ThemeProvider')) {
      this.log('UX Polish', 'Theme provider', 'PASS', 'Theme provider configured');
    } else {
      this.log('UX Polish', 'Theme provider', 'FAIL', 'Theme provider missing');
    }

    // Check enhanced toaster configuration
    if (this.checkFileContains('app/layout.tsx', 'richColors')) {
      this.log('UX Polish', 'Enhanced toaster', 'PASS', 'Toaster enhanced with rich colors');
    } else {
      this.log('UX Polish', 'Enhanced toaster', 'FAIL', 'Toaster not enhanced');
    }

    // Check error boundary in layout
    if (this.checkFileContains('app/layout.tsx', 'ErrorBoundary')) {
      this.log('UX Polish', 'Global error boundary', 'PASS', 'Error boundary in root layout');
    } else {
      this.log('UX Polish', 'Global error boundary', 'FAIL', 'Error boundary not in layout');
    }
  }

  // 5. INTEGRATION VALIDATION
  validateIntegration() {
    console.log('\n🔗 Validating System Integration...\n');

    // Check dashboard uses enhanced network utilities
    if (this.checkFileContains('app/dashboard/page.tsx', 'getNetworkAwareOptions')) {
      this.log('Integration', 'Dashboard network integration', 'PASS', 'Dashboard uses network-aware options');
    } else {
      this.log('Integration', 'Dashboard network integration', 'FAIL', 'Dashboard not using network utilities');
    }

    // Check dashboard uses enhanced toast system
    if (this.checkFileContains('app/dashboard/page.tsx', 'toastUtils')) {
      this.log('Integration', 'Dashboard toast integration', 'PASS', 'Dashboard uses enhanced toasts');
    } else {
      this.log('Integration', 'Dashboard toast integration', 'FAIL', 'Dashboard not using toast utils');
    }

    // Check auth pages use enhanced toast system
    if (this.checkFileContains('app/auth/sign-in/page.tsx', 'toastUtils')) {
      this.log('Integration', 'Auth toast integration', 'PASS', 'Auth pages use enhanced toasts');
    } else {
      this.log('Integration', 'Auth toast integration', 'FAIL', 'Auth pages not using toast utils');
    }

    // Check network monitoring integration
    if (this.checkFileContains('lib/network-utils.ts', 'NetworkToastManager')) {
      this.log('Integration', 'Network toast integration', 'PASS', 'Network monitoring integrated with toasts');
    } else {
      this.log('Integration', 'Network toast integration', 'FAIL', 'Network monitoring not integrated');
    }
  }

  // Generate summary report
  generateSummary() {
    console.log('\n📊 VALIDATION SUMMARY\n');
    console.log('='.repeat(50));

    const categories = [...new Set(this.results.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.status === 'PASS').length;
      const failed = categoryResults.filter(r => r.status === 'FAIL').length;
      const warnings = categoryResults.filter(r => r.status === 'WARNING').length;
      const total = categoryResults.length;

      console.log(`\n${category}:`);
      console.log(`  ✅ Passed: ${passed}/${total}`);
      if (failed > 0) console.log(`  ❌ Failed: ${failed}/${total}`);
      if (warnings > 0) console.log(`  ⚠️  Warnings: ${warnings}/${total}`);
    });

    const totalPassed = this.results.filter(r => r.status === 'PASS').length;
    const totalFailed = this.results.filter(r => r.status === 'FAIL').length;
    const totalWarnings = this.results.filter(r => r.status === 'WARNING').length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(50));
    console.log(`OVERALL: ${totalPassed}/${total} tests passed`);
    
    if (totalFailed === 0 && totalWarnings === 0) {
      console.log('🎉 ALL PRODUCTION FIXES VALIDATED SUCCESSFULLY!');
    } else if (totalFailed === 0) {
      console.log('✅ All critical tests passed (some warnings)');
    } else {
      console.log('❌ Some critical tests failed - review required');
    }

    return totalFailed === 0;
  }

  // Run all validations
  async runAll(): Promise<boolean> {
    console.log('🚀 Starting ProjectForge Production Validation...\n');

    this.validateAuthRouting();
    this.validateNetworkStability();
    this.validateMobileResponsiveness();
    this.validateUXPolish();
    this.validateIntegration();

    return this.generateSummary();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.runAll().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default ProductionValidator;