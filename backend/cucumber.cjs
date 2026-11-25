module.exports = {
  default: {
    paths: ['tests/bdd/features/**/*.feature'],
    import: ['tests/bdd/step-definitions/**/*.js'],
    format: [
      'summary',
      'html:tests/bdd/reports/cucumber-report.html',
      'json:tests/bdd/reports/cucumber-report.json',
    ],
  },
};
