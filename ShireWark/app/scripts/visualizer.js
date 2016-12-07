/**
 * Created by shane on 12/5/16.
 */
/* eslint-env browser */
(function() {

  // Containers for all the nodes and edges between them
  var nodes = new vis.DataSet([]);
  var edges = new vis.DataSet([]);

  //Visual options
  var options = {};
  var treeStructure = false;
  var waitInterval = 0;

  //Interval ID used to stop and start the gathering of 'real-time' data
  var intervalId = -1;

  /**
   * Initializes the network with the nodes (empty), edges (empty), and options
   * to alter the networks visual appearance.
   */
  function initializeEmptyNetwork() {


    //In case the nodes or edges have data clear them.
    nodes.clear();
    edges.clear();


    initWithOptions();


  }

  function initWithOptions() {

    //Get the HTML element that the network will be rendered on
    var container = document.getElementById('mynetwork');

    //Create a data object for the network
    var data = {
      nodes: nodes,
      edges: edges
    };

    //Create the options for the networks visual appearnce.
    options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 3,
          max: 15
        }
      },
      edges: {
        scaling: {
          min: 1,
          max: 15
        },
        smooth: {
          type: "vertical",
          forceDirection: "none",
          roundness: 0
        }
      },
      physics: {
        enabled: true
      }
    };

    if(treeStructure)
    {
      options.layout = {
        hierarchical: {
          direction: "UD",
          levelSeparation: 250,
          nodeSpacing: 100
        }
      };
    }

    //Initialize the visual network with the provided parameters
    var network = new vis.Network(container, data, options);

  }

  //When the page is fully rendered initialize the network
  $(document).ready(function() {
    initializeEmptyNetwork();
  });


  //When the tree structure checkbox is clicked update the UI
  $('#treeCheck').change(function() {
    treeStructure = $(this).is(":checked");
    initWithOptions();
  });

  //When the visual delay checkbox is selected adjust the waitInterval for updating the network
  $('#waitCheck').change(function() {
    waitInterval = $(this).is(":checked") ? 100 : 0;
  });

  //Click event handler for the start button
  $('#startBtn').click(function() {

    //If there is a valid intervalId then we are running and should stop
    if(intervalId != -1) {

      //Cancel the interval to stop calling the database
      clearInterval(intervalId);
      intervalId = -1;

      //Change the UI accordingly
      $('#startBtn').html("Start");

      //Cancel the event
      return;
    }

    // Update the UI since we are starting
    $('#startBtn').html("Stop");


    //Set the intervalId for the funciton that will call the database every 5 seconds

    var intervalFunc = function () {
      //The current time to filter the DB query
      var curTime = new Date();

      //Go back in time a few seconds to ensure we get some data
      curTime.setSeconds(curTime.getSeconds() - 15);

      //Send the request to the AWS server
      $.get('https://2iyjl40fvc.execute-api.us-west-2.amazonaws.com/prod?where=date_created>\"' + curTime.toMysqlFormat() +'\"', {} , updateInfo, 'json');
    };

    intervalFunc();
    intervalId = setInterval(intervalFunc, 5000);

  });


  function updateInfo(jsonResponse) {

    var waitTime = 0;

    //Iterate through each route and update the visual network
    _.each(jsonResponse.routes, function(route) {

      //Wrap the update in a timeout so that the UI doesn't get spammed with a giant update
      //every 5 seconds unless the visual delay is not checked
      setTimeout(function() {

        //If the stopped button was pressed kill all future timeouts
        if(intervalId == -1)
          return;

        //Update the nodes (creating any new ones if they do not already exist)
        nodes.update({id: route.source, label: route.source});
        nodes.update({id: route.dest, label: route.dest});

        //Create an edgeId using the source and destination
        var edgeId = route.source + " " + route.dest;

        //A placeholder for the route's data from the last iteration
        var oldSize = 0;


        //If there was an older route get the old size
        if(edges.get(edgeId) !== null) {
          oldSize = edges.get(edgeId).value;
        }

        //Update the edge (or create a new one if it didn't already exist)
        edges.update(
          {
            id: edgeId,
            from: route.source,
            to: route.dest,
            value: oldSize + route.Size_packets,
            title: oldSize + (route.Size_packets) + " bytes",
            arrows: 'to',
            length: 350,
            arrowStrikethrough: false
          });
      }, waitTime);

      //Increment the waitTime with the interval
      waitTime += waitInterval;

      //Make sure the waitTime isn't greater than 10 seconds otherwise things will get too out of sync
      if(waitTime >= 10000)
        waitTime = 10000;

    });
  }

  /**
   * Format dates so that there are at least two digits
   **/
  function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
  }

  /**
   * Converts the javascript Date object to a MysqlFormat that can be sent in a query
   **/
  Date.prototype.toMysqlFormat = function() {
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getMinutes()) + ":" + twoDigits(this.getSeconds());
  };

})();
