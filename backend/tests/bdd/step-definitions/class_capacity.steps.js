import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import esmock from 'esmock';

function fakeRes() {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

Given('a class with maxStudents set to {int}', function (max) {
  this.targetClass = { _id: 'c1', maxStudents: max };
  this.approvedCount = 0;
});

Given('the class already has {int} approved students', function (count) {
  this.approvedCount = count;
});

When('the teacher approves one more pending enrollment request', async function () {
  const { respondToEnrollment } = await esmock('../../../src/controllers/classGroupController.js', {
    '../../../src/models/Enrollment.js': {
      default: {
        // NOTE: respondToEnrollment() never calls countDocuments to check capacity -
        // that is exactly the gap this scenario documents.
        countDocuments: async () => this.approvedCount,
        findOneAndUpdate: () => ({ populate: async () => ({ _id: 'e-extra', status: 'approved' }) }),
      },
    },
  });
  const req = { body: { status: 'approved' }, targetClass: this.targetClass, params: { enrollmentId: 'e-extra' } };
  this.res = fakeRes();
  await respondToEnrollment(req, this.res);
});

Then('today the request is still approved, because no capacity check exists yet', function () {
  assert.equal(this.res.body.status, 'approved');
  assert.notEqual(this.res.statusCode, 409);
});
