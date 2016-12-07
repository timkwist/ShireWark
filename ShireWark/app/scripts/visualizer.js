/**
 * Created by shane on 12/5/16.
 */
/* eslint-env browser */
(function() {

  var nodes = new vis.DataSet([]);

  // create an array with edges
  var edges = new vis.DataSet([]);

  var maxPackets = 1;

  var intervalId;

  function initializeEmptyNetwork() {
    var container = document.getElementById('mynetwork');
    nodes.clear();
    edges.clear();
    var data = {
      nodes: nodes,
      edges: edges
    };
    var options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 5,
          max: 15
        }
        // size: 25
      },
      edges: {
        scaling: {
          min: 1,
          max: 15
        }
      },
      // layout: {
      //   hierarchical: {
      //     direction: "UD",
      //     levelSeparation: 250,
      //     nodeSpacing: 100
      //   }
      // },
      physics: {
        enabled: true
      },
      "edges": {
        "smooth": {
          "type": "vertical",
          "forceDirection": "none",
          "roundness": 0
        }
      },
    };
    var network = new vis.Network(container, data, options);
  }


  initializeEmptyNetwork();


  $('#stopBtn').click(function() {

    clearInterval(intervalId);

  })

  $('#startBtn').click(function() {

    var curTime = new Date();
    curTime.setSeconds(curTime.getSeconds() - 15);

    console.log(curTime.toMysqlFormat());

    intervalId = setInterval(function() {
      $.get('https://2iyjl40fvc.execute-api.us-west-2.amazonaws.com/prod?where=date_created>\"' + curTime.toMysqlFormat() +'\"', {} , updateInfo, 'json');
    }, 5000);

    // $.get('https://2iyjl40fvc.execute-api.us-west-2.amazonaws.com/prod?where=source=\"199.9.254.145\"', {} , updateInfo, 'json');

    // $.get('https://2iyjl40fvc.execute-api.us-west-2.amazonaws.com/prod', {} , updateInfo, 'json');
    maxPackets = 1;

  });

  function updateInfo(jsonResponse) {

    var curTime = new Date();

    var updatedList = _.filter(jsonResponse.routes, function(route) {

      var otherDate = convertDate(new Date(route.date));

      return otherDate <= curTime;

      //TODO: Change the inequality!

    });

    _.each(updatedList, function(route) {

      console.log(route.Size_packets);

      nodes.update({id: route.source, label: route.source, value: route.Size_packets});
      nodes.update({id: route.dest, label: route.dest});


      // if(nodes.get(route.source) == null) {
      //   nodes.add({id: route.source, label: route.source, value: route.Num_packets});
      // }
      // else {
      //   var oldPackets = nodes.get(route.source).Num_packets;
      //   nodes.update({id: route.source, value: oldPackets + route.Num_packets});
      // }
      //
      // if(nodes.get(route.dest) == null) {
      //   nodes.add({id: route.dest, label: route.dest, value: route.Num_packets});
      // }
      // else {
      //   var oldPackets = nodes.get(route.dest).Num_packets;
      //   nodes.update({id: route.dest, value: oldPackets + route.Num_packets});
      // }

      var edgeId = route.source + " " + route.dest;
      var oldPackets = 0;

      if(edges.get(edgeId) !== null) {
        oldPackets = edges.get(edgeId).value;
        console.log(oldPackets);
      }

      // console.log(route.Num_packets);

      edges.update(
        {
          id: edgeId,
          from: route.source,
          to: route.dest,
          value: oldPackets + (route.Size_packets), //* route.Size_packets),
          title: oldPackets + (route.Size_packets) + " bytes", //* route.Size_packets),
          arrows: 'to',
          length: 350,
          arrowStrikethrough: false
      });

    });




  }


  function convertDate(date) {
    date.setTime( date.getTime());// + date.getTimezoneOffset()*60*1000 );
    return date;
  }


  /**
   * You first need to create a formatting function to pad numbers to two digits…
   **/
  function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
  }

  /**
   * …and then create the method to output the date string as desired.
   * Some people hate using prototypes this way, but if you are going
   * to apply this to more than one Date object, having it as a prototype
   * makes sense.
   **/
  Date.prototype.toMysqlFormat = function() {
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getMinutes()) + ":" + twoDigits(this.getSeconds());
  };

})();
