import EmberObject from "@ember/object";
import { render } from "@ember/test-helpers";
import hbs from "htmlbars-inline-precompile";
import { module, test } from "qunit";
import { setupRenderingTest } from "discourse/tests/helpers/component-test";
import pretender, { response } from "discourse/tests/helpers/create-pretender";
import {
  count,
  exists,
  query,
  queryAll,
} from "discourse/tests/helpers/qunit-helpers";
import I18n from "discourse-i18n";

let requests = 0;

module("Poll | Component | poll", function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    pretender.put("/polls/vote", () => {
      ++requests;
      return response({
        poll: {
          name: "poll",
          type: "regular",
          status: "open",
          results: "always",
          options: [
            {
              id: "1f972d1df351de3ce35a787c89faad29",
              html: "yes",
              votes: 1,
            },
            {
              id: "d7ebc3a9beea2e680815a1e4f57d6db6",
              html: "no",
              votes: 0,
            },
          ],
          voters: 1,
          chart_type: "bar",
        },
        vote: ["1f972d1df351de3ce35a787c89faad29"],
      });
    });
  });

  test("shows vote", async function (assert) {
    this.setProperties({
      attributes: EmberObject.create({
        post: EmberObject.create({
          id: 42,
          topic: {
            archived: false,
          },
          user_id: 29,
        }),
        poll: EmberObject.create({
          name: "poll",
          type: "regular",
          status: "closed",
          results: "always",
          options: [
            { id: "1f972d1df351de3ce35a787c89faad29", html: "yes", votes: 1 },
            { id: "d7ebc3a9beea2e680815a1e4f57d6db6", html: "no", votes: 0 },
          ],
          voters: 1,
          chart_type: "bar",
        }),
        vote: [],
        groupableUserFields: [],
      }),
      preloadedVoters: [],
    });

    await render(
      hbs`<Poll @attrs={{this.attributes}} @preloadedVoters={{this.preloadedVoters}} />`
    );

    assert.deepEqual(
      Array.from(queryAll(".results li .option p")).map(
        (span) => span.innerText
      ),
      ["100% yes", "0% no"]
    );
  });

  test("can vote", async function (assert) {
    this.setProperties({
      attributes: EmberObject.create({
        post: EmberObject.create({
          id: 42,
          topic: {
            archived: false,
          },
          user_id: 29,
        }),
        poll: EmberObject.create({
          name: "poll",
          type: "regular",
          status: "open",
          results: "always",
          options: [
            { id: "1f972d1df351de3ce35a787c89faad29", html: "yes", votes: 0 },
            { id: "d7ebc3a9beea2e680815a1e4f57d6db6", html: "no", votes: 0 },
          ],
          voters: 0,
          chart_type: "bar",
        }),
        vote: [],
        groupableUserFields: [],
      }),
      preloadedVoters: [],
    });

    await render(
      hbs`<Poll @attrs={{this.attributes}} @preloadedVoters={{this.preloadedVoters}} />`
    );

    requests = 0;

    await click(
      "li[data-poll-option-id='1f972d1df351de3ce35a787c89faad29'] button"
    );
    assert.strictEqual(requests, 1);
    assert.strictEqual(count(".chosen"), 1);

    await click(".toggle-results");
    assert.strictEqual(
      count("li[data-poll-option-id='1f972d1df351de3ce35a787c89faad29']"),
      1
    );
  });

  test("cannot vote if not member of the right group", async function (assert) {
    this.setProperties({
      attributes: EmberObject.create({
        post: EmberObject.create({
          id: 42,
          topic: {
            archived: false,
          },
          user_id: 29,
        }),
        poll: EmberObject.create({
          name: "poll",
          type: "regular",
          status: "open",
          results: "always",
          options: [
            { id: "1f972d1df351de3ce35a787c89faad29", html: "yes", votes: 0 },
            { id: "d7ebc3a9beea2e680815a1e4f57d6db6", html: "no", votes: 0 },
          ],
          voters: 0,
          chart_type: "bar",
          groups: "foo",
        }),
        vote: [],
        groupableUserFields: [],
      }),
      preloadedVoters: [],
    });

    await render(
      hbs`<Poll @attrs={{this.attributes}} @preloadedVoters={{this.preloadedVoters}} />`
    );

    requests = 0;

    await click(
      "li[data-poll-option-id='1f972d1df351de3ce35a787c89faad29'] button"
    );
    assert.strictEqual(
      query(".poll-container .alert").innerText,
      I18n.t("poll.results.groups.title", { groups: "foo" })
    );
    assert.strictEqual(requests, 0);
    assert.ok(!exists(".chosen"));
  });

  test("voting on a multiple poll with no min attribute", async function (assert) {
    this.setProperties({
      attributes: EmberObject.create({
        post: EmberObject.create({
          id: 42,
          topic: {
            archived: false,
          },
          user_id: 29,
        }),
        poll: EmberObject.create({
          name: "poll",
          type: "multiple",
          status: "open",
          results: "always",
          max: 2,
          options: [
            { id: "1f972d1df351de3ce35a787c89faad29", html: "yes", votes: 0 },
            { id: "d7ebc3a9beea2e680815a1e4f57d6db6", html: "no", votes: 0 },
          ],
          voters: 0,
          chart_type: "bar",
        }),
        vote: [],
        groupableUserFields: [],
      }),
      preloadedVoters: [],
    });
    await render(
      hbs`<Poll @attrs={{this.attributes}} @preloadedVoters={{this.preloadedVoters}} />`
    );
  });

  test("one vote and its for current user - vote", async function (assert) {
    this.setProperties({
      attributes: EmberObject.create({
        post: EmberObject.create({
          id: 42,
          topic: {
            archived: false,
          },
          user_id: 29,
        }),
        poll: EmberObject.create({
          name: "poll",
          type: "regular",
          status: "open",
          results: "always",
          options: [
            { id: "1f972d1df351de3ce35a787c89faad29", html: "yes", votes: 1 },
            { id: "d7ebc3a9beea2e680815a1e4f57d6db6", html: "no", votes: 0 },
          ],
          voters: 1,
          chart_type: "bar",
        }),
        vote: ["1f972d1df351de3ce35a787c89faad29"],
        groupableUserFields: [],
      }),
      preloadedVoters: [],
      options: [
        { id: "1f972d1df351de3ce35a787c89faad29", html: "yes", votes: 1 },
        { id: "d7ebc3a9beea2e680815a1e4f57d6db6", html: "no", votes: 0 },
      ],
      id: 42,
      poll: EmberObject.create({
        name: "poll",
        type: "regular",
        status: "open",
        results: "always",
        options: [
          { id: "1f972d1df351de3ce35a787c89faad29", html: "yes", votes: 1 },
          { id: "d7ebc3a9beea2e680815a1e4f57d6db6", html: "no", votes: 0 },
        ],
        voters: 1,
        chart_type: "bar",
      }),
      titleHTML: "poll",
      isRankedChoice: false,
      isMultiple: false,
      isNumber: false,
      status: "open",
      showResults: false,
      closed: false,
      topicArchived: false,
      staffOnly: false,
      voters: 1,
      vote: ["1f972d1df351de3ce35a787c89faad29"],
      rankedChoiceDropdownContent: [],
      hasSavedVote: true,
      rankedChoiceOutcome: {},
      groupableUserFields: [],
      removeVote: () => {},
      castVotes: () => {},
      toggleStatus: () => {},
      toggleResults: () => {},
      toggleOption: () => {},
      fetchVoters: () => {},
    });

    await render(
      hbs`<Poll
        @attrs={{this.attributes}}
        @preloadedVoters={{this.preloadedVoters}}
        @options={{this.options}}
        @id={{this.id}}
        @poll={{this.poll}}
        @post={{this.post}}
        @titleHTML={{this.titleHTML}}
        @isRankedChoice={{this.isRankedChoice}}
        @isMultiple={{this.isMultiple}}
        @isNumber={{this.isNumber}}
        @status={{this.status}}
        @showResults={{this.showResults}}
        @closed={{this.closed}}
        @topicArchived={{this.topicArchived}}
        @staffOnly={{this.staffOnly}}
        @preloadedVoters={{this.preloadedVoters}}
        @voters={{this.voters}}
        @vote={{this.vote}}
        @rankedChoiceDropdownContent={{this.rankedChoiceDropdownContent}}
        @hasSavedVote={{this.hasSavedVote}}
        @rankedChoiceOutcome={{this.rankedChoiceOutcome}}
        @groupableUserFields={{this.groupableUserFields}}
        @removeVote={{this.removeVote}}
        @castVotes={{this.castVotes}}
        @toggleStatus={{this.toggleStatus}}
        @toggleResults={{this.toggleResults}}
        @toggleOption={{this.toggleOption}}
        @fetchVoters={{this.fetchVoters}}
      />`
    );

    assert.strictEqual(count(".toggle-results"), 1);

    assert.ok(exists(".poll-buttons .cast-votes:disabled"));

    await click(
      "li[data-poll-option-id='1f972d1df351de3ce35a787c89faad29'] button"
    );

    await click(".poll-buttons .cast-votes");
    assert.ok(exists(".chosen"));
  });
});
